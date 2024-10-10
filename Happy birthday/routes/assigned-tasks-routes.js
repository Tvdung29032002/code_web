const express = require("express");
const router = express.Router();

// Hàm helper để format ngày
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Các route liên quan đến assigned tasks
router.post("/assign-task", async (req, res) => {
  try {
    const {
      userId,
      taskName,
      taskDescription,
      startDateTime,
      endDateTime,
      priority,
    } = req.body;

    if (!userId || !taskName || !startDateTime || !endDateTime || !priority) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết để giao nhiệm vụ",
      });
    }

    const [result] = await req.dbConnection.execute(
      "INSERT INTO assigned_tasks (user_id, task_name, task_description, start_date, end_date, priority) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, taskName, taskDescription, startDateTime, endDateTime, priority]
    );

    res.json({
      success: true,
      message: "Nhiệm vụ đã được giao thành công",
      taskId: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi khi giao nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể giao nhiệm vụ",
      error: error.message,
    });
  }
});

router.get("/assigned-tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter } = req.query;
    let query = `
      SELECT at.*, 
             DATE_FORMAT(at.completed_at, '%d/%m/%Y %H:%i') as formatted_completed_at, 
             DATE_FORMAT(at.updated_at, '%d/%m/%Y %H:%i') as formatted_updated_at,
             concat(u.firstName,' ',u.lastName, ' (',u.username,')') as creator_name,
             CASE 
               WHEN at.completed = 1 AND at.completed_at > at.end_date THEN 'overdue'
               WHEN at.completed = 1 AND at.completed_at <= at.end_date THEN 'on_time'
               WHEN at.completed = 0 AND CURRENT_TIMESTAMP > at.end_date THEN 'overdue'
               ELSE 'in_progress'
             END as completion_status
      FROM assigned_tasks at
      JOIN users u ON at.user_id = u.id
      WHERE at.user_id = ?
    `;
    const queryParams = [userId];

    if (filter === "inProgress") {
      query += " AND at.completed = 0 AND at.end_date >= CURDATE()";
    } else if (filter === "completed") {
      query += " AND at.completed = 1";
    } else if (filter === "overdue") {
      query += " AND at.completed = 0 AND at.end_date < CURDATE()";
    }

    query += " ORDER BY at.start_date";

    const [tasks] = await req.dbConnection.execute(query, queryParams);
    res.json({ success: true, tasks: tasks });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhiệm vụ đã giao:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách nhiệm vụ đã giao",
      error: error.message,
    });
  }
});

router.put("/assigned-tasks/:taskId/complete", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    const completedAt = completed
      ? new Date().toISOString().slice(0, 19).replace("T", " ")
      : null;

    await req.dbConnection.execute(
      "UPDATE assigned_tasks SET completed = ?, completed_at = ? WHERE id = ?",
      [completed, completedAt, taskId]
    );

    res.json({
      success: true,
      message: "Trạng thái hoàn thành nhiệm vụ đã được cập nhật",
      completedAt: completedAt,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái hoàn thành nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái hoàn thành nhiệm vụ",
      error: error.message,
    });
  }
});

router.get("/upcoming-tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [tasks] = await req.dbConnection.execute(
      `SELECT * FROM assigned_tasks 
     WHERE user_id = ? 
     AND end_date BETWEEN ? AND ? 
     ORDER BY end_date ASC 
     LIMIT 5`,
      [userId, formatDate(today), formatDate(threeDaysLater)]
    );

    res.json({ success: true, tasks: tasks });
  } catch (error) {
    console.error("Lỗi khi lấy nhiệm vụ sắp đến hạn:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy nhiệm vụ sắp đến hạn",
      error: error.message,
    });
  }
});

router.get("/task-overview/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [overview] = await req.dbConnection.execute(
      `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN completed = 0 AND end_date >= CURDATE() THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN completed = 0 AND end_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
    FROM assigned_tasks
    WHERE user_id = ?
  `,
      [userId]
    );

    res.json({
      success: true,
      overview: {
        total: overview[0].total || 0,
        pending: overview[0].pending || 0,
        inProgress: overview[0].pending || 0,
        completed: overview[0].completed || 0,
        overdue: overview[0].overdue || 0,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy tổng quan nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy tổng quan nhiệm vụ",
      error: error.message,
    });
  }
});

router.get("/assigned-tasks/search/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { searchTerm } = req.query;
    const [tasks] = await req.dbConnection.execute(
      `SELECT at.*, 
              DATE_FORMAT(at.completed_at, '%d/%m/%Y %H:%i') as formatted_completed_at, 
              DATE_FORMAT(at.updated_at, '%d/%m/%Y %H:%i') as formatted_updated_at,
             concat(u.firstName,' ',u.lastName, ' (',u.username,')') as creator_name
      FROM assigned_tasks at
      JOIN users u ON at.user_id = u.id
       WHERE at.user_id = ? 
       AND (at.task_name LIKE ? OR at.task_description LIKE ?)
       ORDER BY at.start_date`,
      [userId, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    res.json({ success: true, tasks: tasks });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm nhiệm vụ đã giao:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm kiếm nhiệm vụ đã giao",
      error: error.message,
    });
  }
});

router.put("/assigned-tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { taskName, taskDescription, startDateTime, endDateTime, priority } =
      req.body;

    await req.dbConnection.execute(
      "UPDATE assigned_tasks SET task_name = ?, task_description = ?, start_date = ?, end_date = ?, priority = ? WHERE id = ?",
      [taskName, taskDescription, startDateTime, endDateTime, priority, taskId]
    );

    res.json({
      success: true,
      message: "Nhiệm vụ đã được cập nhật thành công",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật nhiệm vụ",
      error: error.message,
    });
  }
});

router.get("/assigned-tasks/detail/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const [tasks] = await req.dbConnection.execute(
      "SELECT *, DATE_FORMAT(completed_at, '%d/%m/%Y %H:%i') as formatted_completed_at, DATE_FORMAT(updated_at, '%d/%m/%Y %H:%i') as formatted_updated_at FROM assigned_tasks WHERE id = ?",
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhiệm vụ",
      });
    }

    res.json({ success: true, task: tasks[0] });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin nhiệm vụ",
      error: error.message,
    });
  }
});

// Thêm route mới cho báo cáo
router.get("/task-reports/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange } = req.query; // 'currentMonth' hoặc 'year'

    let dateCondition;
    if (timeRange === "year") {
      dateCondition = "created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    } else {
      dateCondition =
        "created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)";
    }

    const [overview] = await req.dbConnection.execute(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN completed = 0 AND end_date >= CURDATE() THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN completed = 0 AND end_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as highPriority,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as mediumPriority,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as lowPriority
      FROM assigned_tasks
      WHERE user_id = ? AND ${dateCondition}
    `,
      [userId]
    );

    let progressQuery;
    if (timeRange === "year") {
      progressQuery = `
        SELECT DATE_FORMAT(created_at, '%Y-%m-01') as date, COUNT(*) as count
        FROM assigned_tasks
        WHERE user_id = ? AND ${dateCondition}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-01')
        ORDER BY date
      `;
    } else {
      progressQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM assigned_tasks
        WHERE user_id = ? AND ${dateCondition}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
    }

    const [progress] = await req.dbConnection.execute(progressQuery, [userId]);

    res.json({
      success: true,
      reports: {
        overview: overview[0],
        progress: progress,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu báo cáo:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu báo cáo",
      error: error.message,
    });
  }
});

// Thêm route mới này vào file
router.get("/assigned-tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, Number(month) + 1, 0);

    const [tasks] = await req.dbConnection.execute(
      `SELECT * FROM assigned_tasks 
       WHERE user_id = ? 
       AND start_date BETWEEN ? AND ?
       ORDER BY start_date`,
      [userId, startDate.toISOString(), endDate.toISOString()]
    );

    res.json({ success: true, tasks: tasks });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách nhiệm vụ",
      error: error.message,
    });
  }
});

module.exports = router;
