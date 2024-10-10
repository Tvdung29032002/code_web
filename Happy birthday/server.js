const express = require("express");
const http = require("http"); // Thêm dòng này
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const englishVocabularyRoutes = require("./routes/english-vocabulary-routes");
const chineseVocabularyRoutes = require("./routes/chinese-vocabulary-routes");
const passwordRoutes = require("./password-routes");
const mainRoutes = require("./main-routes");
const userManagementRoutes = require("./user_management_routes");
//const scheduleRoutes = require("./routes/schedule-routes");
const infoForumRoutes = require("./routes/info-forum-routes");
const feedbackRoutes = require("./routes/feedback-routes");
const chatRoutes = require("./routes/chat-routes");
const personalInfoRoutes = require("./routes/personal-info-routes"); // Thêm dòng này
const loginRoutes = require("./routes/login-routes");
const chatbotRoutes = require("./routes/chatbot-routes");
const tasksRoutes = require("./routes/tasks-routes");
const assignedTasksRoutes = require("./routes/assigned-tasks-routes");
require("./cron-jobs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Tạo một Map để lưu trữ kết nối WebSocket cho mỗi người dùng
const userSockets = new Map();

// Hàm để cập nhật trạng thái offline
async function updateOfflineStatus(userId) {
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      "UPDATE users SET online_status = FALSE, last_activity = CURRENT_TIMESTAMP WHERE id = ?",
      [userId]
    );
    connection.release();
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái offline:", error);
  }
}

// Cấu hình kết nối cơ sở dữ liệu
const dbConfig = {
  host: "127.0.0.1",
  user: "dungtv",
  password: "Vboyht@02",
  database: "mydatabase",
  port: 3306,
};

// Tạo pool kết nối
const pool = mysql.createPool(dbConfig);

// Middleware để gắn kết nối vào request
app.use(async (req, res, next) => {
  try {
    req.dbConnection = await pool.getConnection();
    next();
  } catch (error) {
    console.error("Lỗi khi kết nối đến cơ sở dữ liệu:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi kết nối cơ sở dữ liệu" });
  }
});

// Middleware để giải phóng kết nối sau khi xử lý request
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.dbConnection) {
      req.dbConnection.release();
    }
  });
  next();
});

// Cấu hình CORS
app.use(
  cors({
    origin: "http://192.168.0.103:5500", // Địa chỉ của client
    credentials: true,
  })
);

// Middleware setup
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(path.join(__dirname, "Vocabulary")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/messenger", express.static(path.join(__dirname, "messenger")));

// Use the routes
app.use("/api", englishVocabularyRoutes);
app.use("/api", chineseVocabularyRoutes);
app.use("/api", passwordRoutes);
app.use("/api", mainRoutes);
app.use("/api", userManagementRoutes);
//app.use("/api", scheduleRoutes);
app.use("/api", infoForumRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", chatRoutes);
app.use("/api", personalInfoRoutes); // Thêm dòng này
app.use("/api", loginRoutes);
app.use("/api", chatbotRoutes);
app.use("/api", tasksRoutes);
app.use("/api", assignedTasksRoutes);

// Serve vocabulary.html
app.get("/vocabulary", (req, res) => {
  res.sendFile(path.join(__dirname, "Vocabulary", "vocabulary.html"));
});

// Add this near your other route definitions
app.get("/api/weather", async (req, res) => {
  try {
    const [rows] = await req.dbConnection.execute("SELECT * FROM weather");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Trong phần xử lý WebSocket
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "register") {
      userSockets.set(data.userId, ws);
      ws.userId = data.userId;
      console.log(`User ${data.userId} connected`);
    } else if (data.type === "messages_seen") {
      // Gửi thông báo đến người gửi tin nhắn
      const targetWs = data.groupId
        ? Array.from(wss.clients).filter(
            (client) => client.groupId === data.groupId
          )
        : userSockets.get(data.otherUserId);

      if (targetWs) {
        const notification = JSON.stringify({
          type: "messages_seen_update",
          messageIds: data.messageIds,
          groupId: data.groupId,
          otherUserId: data.otherUserId,
        });
        if (Array.isArray(targetWs)) {
          targetWs.forEach((client) => client.send(notification));
        } else {
          targetWs.send(notification);
        }
      }
    }
  });

  // Xử lý khi người dùng ngắt kết nối
  ws.on("close", () => {
    if (ws.userId) {
      updateOfflineStatus(ws.userId);
      userSockets.delete(ws.userId);
      console.log(`User ${ws.userId} disconnected`);
    }
  });
});
