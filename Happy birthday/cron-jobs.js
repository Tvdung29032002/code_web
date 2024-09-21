const cron = require("node-cron");
const mysql = require("mysql2/promise");

// Tạo pool connection để sử dụng cho cronjob
const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "dungtv",
  password: "Vboyht@02",
  database: "mydatabase",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Cronjob chạy mỗi phút
cron.schedule("* * * * *", async () => {
  try {
    const connection = await pool.getConnection();

    // Cập nhật trạng thái offline cho người dùng không hoạt động trong 5 phút
    await connection.execute(`
      UPDATE users 
      SET online_status = FALSE 
      WHERE last_activity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        AND online_status = TRUE
    `);
    connection.release();
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái offline:", error);
  }
});
