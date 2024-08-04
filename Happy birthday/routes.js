const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
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
      CASE WHEN pi.phone IS NOT NULL OR pi.bio IS NOT NULL THEN true ELSE false END AS has_updated_info
      FROM users u 
      LEFT JOIN personal_info pi ON u.id = pi.user_id 
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

    console.log("Comparing passwords...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.json({ success: false, message: "Mật khẩu không đúng" });
    }

    console.log("Login successful");
    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
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

// Reset password route
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Received email for password reset:", email);

    const [users] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    console.log("Users found:", users.length);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống.",
      });
    }

    const user = users[0];

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("New password generated");

    await req.dbConnection.execute(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );
    console.log("Password updated in database");

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vboyht35@gmail.com",
        pass: "rwzb tatw piem seuj",
      },
    });

    let mailOptions = {
      from: "vboyht35@gmail.com",
      to: email,
      subject: "Thông tin tài khoản của bạn",
      html: `
        <h2>Thông tin tài khoản của bạn</h2>
        <p><strong>Họ và tên:</strong> ${user.firstName} ${user.lastName}</p>
        <p><strong>Tên đăng nhập:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Ngày sinh:</strong> ${new Date(
          user.birthDate
        ).toLocaleDateString()}</p>
        <p><strong>Giới tính:</strong> ${user.gender}</p>
        <p><strong>Mật khẩu tạm thời của bạn là:</strong> ${newPassword}</p>
        <p>Vui lòng đăng nhập và thay đổi mật khẩu của bạn ngay sau khi nhận được email này.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

    res.json({
      success: true,
      message:
        "Thông tin tài khoản và mật khẩu tạm thời đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể đặt lại mật khẩu",
      error: error.message,
    });
  }
});

// Change password route
router.post("/change-password", async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body;

    const [users] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với email này.",
      });
    }

    const user = users[0];

    const isValidTempPassword = await bcrypt.compare(
      tempPassword,
      user.password
    );

    if (!isValidTempPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu tạm thời không đúng.",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await req.dbConnection.execute(
      "UPDATE users SET password = ?, password_updated_at = CURRENT_TIMESTAMP WHERE email = ?",
      [hashedNewPassword, email]
    );

    res.json({
      success: true,
      message: "Mật khẩu đã được thay đổi thành công.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thay đổi mật khẩu",
      error: error.message,
    });
  }
});

// Get user details route
router.get("/user-details/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const [users] = await req.dbConnection.execute(
      `SELECT u.id, u.firstName, u.lastName, u.email, u.birthDate, u.gender, 
              pi.phone, pi.bio, pi.photo_url 
       FROM users u 
       LEFT JOIN personal_info pi ON u.id = pi.user_id 
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng.",
      });
    }

    const user = users[0];
    res.json({
      success: true,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        birthDate: user.birthDate,
        gender: user.gender,
        phone: user.phone || "",
        bio: user.bio || "",
        photoUrl: user.photo_url || "",
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin chi tiết người dùng",
      error: error.message,
    });
  }
});

// Update user info route
router.post(
  "/update-user-info/:username",
  upload.single("photo"),
  async (req, res) => {
    try {
      const { username } = req.params;
      const { name, birthday, gender, email, phone, bio } = req.body;

      console.log("Received update request for user:", username);
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      // Lấy user_id
      const [users] = await req.dbConnection.execute(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      const userId = users[0].id;

      let photoUrl = null;
      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
        console.log("File uploaded successfully:", req.file.path);
      }

      // Kiểm tra xem đã có thông tin cá nhân chưa
      const [existingInfo] = await req.dbConnection.execute(
        "SELECT * FROM personal_info WHERE user_id = ?",
        [userId]
      );

      if (existingInfo.length > 0) {
        // Nếu đã có thông tin, cập nhật
        await req.dbConnection.execute(
          `UPDATE personal_info SET 
         phone = ?, bio = ?, photo_url = COALESCE(?, photo_url), updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
          [phone, bio, photoUrl, userId]
        );
      } else {
        // Nếu chưa có thông tin, thêm mới
        await req.dbConnection.execute(
          `INSERT INTO personal_info (user_id, phone, bio, photo_url) 
         VALUES (?, ?, ?, ?)`,
          [userId, phone, bio, photoUrl]
        );
      }

      // Chuyển đổi ngày sinh sang định dạng YYYY-MM-DD
      const formattedBirthday = new Date(birthday).toISOString().split("T")[0];

      // Cập nhật thông tin trong bảng users
      await req.dbConnection.execute(
        `UPDATE users SET 
       firstName = ?, lastName = ?, birthDate = ?, gender = ?, email = ? 
       WHERE id = ?`,
        [
          name.split(" ")[0],
          name.split(" ").slice(1).join(" "),
          formattedBirthday,
          gender,
          email,
          userId,
        ]
      );

      console.log("User info updated successfully");

      res.json({
        success: true,
        message: "Thông tin đã được cập nhật thành công.",
        photoUrl: photoUrl,
      });
    } catch (error) {
      console.error("Error updating user info:", error);
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật thông tin người dùng",
        error: error.message,
      });
    }
  }
);

// Add vocabulary route
router.post("/add-vocabulary", async (req, res) => {
  try {
    const { word, meaning, phonetic, part_of_speech, example } = req.body;

    if (!word || !meaning || !phonetic || !part_of_speech || !example) {
      return res.status(400).json({
        success: false,
        message: "Từ, nghĩa, phiên âm, từ loại và ví dụ không được để trống",
      });
    }

    // Kiểm tra xem từ đã tồn tại chưa
    const [existingWords] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE word = ?",
      [word]
    );

    if (existingWords.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Từ này đã tồn tại trong cơ sở dữ liệu",
      });
    }

    // Nếu từ chưa tồn tại, tiếp tục thêm vào
    const [result] = await req.dbConnection.execute(
      "INSERT INTO vocabulary (word, meaning, phonetic, part_of_speech, example) VALUES (?, ?, ?, ?, ?)",
      [word, meaning, phonetic, part_of_speech, example]
    );

    res.json({
      success: true,
      message: "Từ vựng đã được thêm thành công",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm từ vựng",
      error: error.message,
    });
  }
});

// Search vocabulary route
router.get("/search-vocabulary", async (req, res) => {
  console.log("Received search request");
  try {
    const searchTerm = req.query.term;
    console.log("Search term:", searchTerm);

    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE word LIKE ? ORDER BY created_at DESC",
      [`%${searchTerm}%`]
    );

    console.log("Search results:", rows.length, "items");
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm kiếm từ vựng",
      error: error.message,
    });
  }
});

// Get vocabulary route
router.get("/vocabulary", async (req, res) => {
  console.log("Received request for vocabulary");
  try {
    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary ORDER BY created_at DESC LIMIT 10"
    );
    console.log("Fetched vocabulary:", rows.length, "items");
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách từ vựng",
      error: error.message,
    });
  }
});

// Update vocabulary route
router.put("/update-vocabulary", async (req, res) => {
  console.log("Received update request for vocabulary");
  try {
    const { id, word, meaning, phonetic, part_of_speech, example } = req.body;

    // Kiểm tra xem từ vựng có tồn tại không
    const [existingWord] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE id = ?",
      [id]
    );

    if (existingWord.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy từ vựng để cập nhật",
      });
    }

    // Cập nhật từ vựng
    const [result] = await req.dbConnection.execute(
      "UPDATE vocabulary SET word = ?, meaning = ?, phonetic = ?, part_of_speech = ?, example = ? WHERE id = ?",
      [word, meaning, phonetic, part_of_speech, example, id]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Từ vựng đã được cập nhật thành công",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật từ vựng",
      });
    }
  } catch (error) {
    console.error("Error updating vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật từ vựng",
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

module.exports = router;
