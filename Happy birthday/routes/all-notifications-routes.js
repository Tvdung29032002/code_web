const express = require("express");
const router = express.Router();

router.get("/all-notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT n.*, at.task_name, at.end_date, at.completed
      FROM notifications n
      JOIN assigned_tasks at ON n.task_id = at.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
    `;

    const [notifications] = await req.dbConnection.execute(query, [userId]);

    res.json({
      success: true,
      notifications: notifications.map((notification) => ({
        ...notification,
        completed: !!notification.completed,
        end_date: formatDate(notification.end_date),
      })),
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông báo",
    });
  }
});

// Thêm hàm này nếu chưa có
function formatDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("vi-VN", options);
}

// API để đánh dấu thông báo là đã đọc hoặc chưa đọc
router.put("/notifications/:notificationId/toggle-read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { isRead } = req.body;

    const [result] = await req.dbConnection.execute(
      "UPDATE notifications SET is_read = ? WHERE id = ?",
      [isRead, notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    res.json({
      success: true,
      message: `Thông báo đã được đánh dấu ${isRead ? "đã đọc" : "chưa đọc"}`,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đọc của thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật trạng thái đọc của thông báo",
    });
  }
});

// API để xóa thông báo
router.delete("/notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const [result] = await req.dbConnection.execute(
      "DELETE FROM notifications WHERE id = ?",
      [notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    res.json({
      success: true,
      message: "Thông báo đã được xóa thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa thông báo",
    });
  }
});

module.exports = router;
