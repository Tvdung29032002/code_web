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

    // WARNING: This can be dangerous and should only be used in a controlled environment
    // Consider implementing additional security measures like query validation or whitelisting
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

// Route to get table list
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
