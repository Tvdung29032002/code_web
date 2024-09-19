const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Multer setup
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Login route
router.post("/login", async (req, res) => {
  console.log("Received login request");
  try {
    const { username, password } = req.body;
    console.log("Login attempt for username:", username);

    const query = `
      SELECT u.*, pi.id AS personal_info_id, 
      CASE WHEN pi.phone IS NOT NULL OR pi.bio IS NOT NULL THEN true ELSE false END AS has_updated_info,
      ura.role, u.failed_login_attempts, u.account_locked_until
      FROM users u 
      LEFT JOIN personal_info pi ON u.id = pi.user_id 
      LEFT JOIN user_roles_actions ura ON u.id = ura.user_id
      WHERE LOWER(u.username) = LOWER(?)
    `;
    console.log("SQL query:", query, "with username:", username);

    console.log("Executing database query...");
    const [users] = await req.dbConnection.execute(query, [username]);
    console.log("Query executed. Users found:", users.length);

    if (users.length === 0) {
      console.log("User not found in database");
      return res.json({
        success: false,
        message: "Tên đăng nhập không tồn tại",
      });
    }

    const user = users[0];
    console.log("User found:", user.username);

    // Kiểm tra xem tài khoản có bị khóa không
    if (
      user.account_locked_until &&
      new Date() < new Date(user.account_locked_until)
    ) {
      return res.json({
        success: false,
        message: `Tài khoản của bạn đã bị khóa. Vui lòng thử lại sau ${new Date(
          user.account_locked_until
        ).toLocaleString()}.`,
      });
    }

    console.log("Comparing passwords...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password");

      // Tăng số lần đăng nhập thất bại
      const newFailedAttempts = user.failed_login_attempts + 1;
      let updateQuery =
        "UPDATE users SET failed_login_attempts = ? WHERE id = ?";
      let updateParams = [newFailedAttempts, user.id];

      // Nếu đã đạt đến 5 lần thất bại, khóa tài khoản
      if (newFailedAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60000); // Khóa trong 30 phút
        updateQuery =
          "UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?";
        updateParams = [newFailedAttempts, lockUntil, user.id];
      }

      await req.dbConnection.execute(updateQuery, updateParams);

      // Trả về thông báo tương ứng
      if (newFailedAttempts >= 5) {
        return res.json({
          success: false,
          message:
            "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng sử dụng chức năng quên mật khẩu để đặt lại mật khẩu.",
        });
      } else if (newFailedAttempts >= 3) {
        return res.json({
          success: false,
          message: `Mật khẩu không đúng. Cảnh báo: Bạn đã nhập sai ${newFailedAttempts} lần. Tài khoản sẽ bị khóa sau 5 lần nhập sai.`,
        });
      } else {
        return res.json({ success: false, message: "Mật khẩu không đúng" });
      }
    }

    // Đặt lại số lần đăng nhập thất bại khi đăng nhập thành công
    await req.dbConnection.execute(
      "UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?",
      [user.id]
    );

    console.log("Login successful");
    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        hasUpdatedInfo: user.has_updated_info === 1,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập thất bại",
      error: error.message,
    });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      birthDate,
      gender,
    } = req.body;

    console.log("Received registration request:", { username, email });

    const [existingUsers] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    console.log("Existing users found:", existingUsers.length);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log("Existing user:", existingUser);

      if (existingUser.username === username) {
        return res
          .status(400)
          .json({ success: false, message: "Username đã tồn tại" });
      } else if (existingUser.email === email) {
        return res
          .status(400)
          .json({ success: false, message: "Email đã tồn tại" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await req.dbConnection.execute(
      "INSERT INTO users (firstName, lastName, username, email, password, birthDate, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, hashedPassword, birthDate, gender]
    );

    const userId = result.insertId;
    await req.dbConnection.execute(
      "INSERT INTO personal_info (user_id, photo_url) VALUES (?, ?)",
      [userId, "/uploads/default.jpg"]
    );

    console.log("User registered successfully");
    res.json({ success: true, message: "Đăng ký thành công!" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng ký thất bại",
      error: error.message,
    });
  }
});

router.post("/execute-custom-query", async (req, res) => {
  try {
    const { query, limit } = req.body;

    // CẢNH BÁO: Điều này có thể nguy hiểm và chỉ nên được sử dụng trong môi trường có kiểm soát
    // Cân nhắc thực hiện các biện pháp bảo mật bổ sung như xác thực truy vấn hoặc danh sách trắng
    let modifiedQuery = query;
    if (limit) {
      modifiedQuery += ` LIMIT ${limit}`;
    }

    const [rows] = await req.dbConnection.execute(modifiedQuery);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Lỗi khi thực hiện truy vấn tùy chỉnh:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thực hiện truy vấn",
      error: error.message,
    });
  }
});

// Root route
router.get("/", (req, res) => {
  res.send("Server is running!");
});

// API route
router.get("/api", (req, res) => {
  res.send("API is running!");
});

// Register info route
router.get("/register", (req, res) => {
  res.json({
    message:
      "Đây là trang đăng ký. Vui lòng sử dụng phương thức POST để đăng ký.",
  });
});

// Login info route
router.get("/login", (req, res) => {
  res.json({
    message:
      "Đây là API đăng nhập. Vui lòng sử dụng phương thức POST để đăng nhập.",
  });
});

// Check database connection route
router.get("/check-db-connection", async (req, res) => {
  try {
    await req.dbConnection.execute("SELECT 1");
    res.json({ success: true, message: "Database connection is working" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Route để lấy danh sách bảng
router.get("/get-table-list", async (req, res) => {
  try {
    const [rows] = await req.dbConnection.execute("SHOW TABLES");
    const tables = rows.map((row) => Object.values(row)[0]);
    res.json({ success: true, tables });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bảng:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách bảng",
      error: error.message,
    });
  }
});

module.exports = router;
