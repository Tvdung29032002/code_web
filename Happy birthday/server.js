const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Cấu hình kết nối MySQL
const dbConfig = {
  host: "127.0.0.1",
  user: "dungtv",
  password: "Vboyht@02",
  database: "mydatabase",
  port: 3306,
};

let connection;

async function connectToDatabase() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database");
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
}

connectToDatabase();

// Route cho trang chủ
app.get("/", (req, res) => {
  res.send("Welcome to the registration server!");
});

// Route kiểm tra API đăng ký
app.get("/api/register", (req, res) => {
  res.json({ message: "Registration API is working" });
});

// Route kiểm tra kết nối cơ sở dữ liệu
app.get("/api/db-check", async (req, res) => {
  try {
    await connection.query("SELECT 1");
    res.json({ message: "Database connection is working" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Database connection failed", error: error.message });
  }
});

// Route đăng ký
app.post("/api/register", async (req, res) => {
  console.log("Received registration request:", req.body);
  try {
    // ... (phần code đăng ký hiện tại của bạn)
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng ký thất bại",
      error: error.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
