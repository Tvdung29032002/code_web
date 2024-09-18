const express = require("express");
const router = express.Router();

// Lấy tất cả nhiệm vụ của người dùng
router.get("/tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [tasks] = await req.dbConnection.execute(
      "SELECT *, is_fixed AS isFixed FROM tasks WHERE user_id = ? ORDER BY date",
      [userId]
    );
    const formattedTasks = tasks.map((task) => ({
      ...task,
      date: formatDate(task.date),
    }));
    res.json({ success: true, tasks: formattedTasks });
  } catch (error) {
    console.error("Lỗi khi lấy nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy nhiệm vụ",
      error: error.message,
    });
  }
});

// Thêm nhiệm vụ mới
router.post("/tasks", async (req, res) => {
  try {
    const { userId, name, type, activity, date } = req.body;
    const formattedDate = formatDate(date);
    const [result] = await req.dbConnection.execute(
      "INSERT INTO tasks (user_id, name, type, activity, date) VALUES (?, ?, ?, ?, ?)",
      [userId, name, type, activity, formattedDate]
    );
    res.json({
      success: true,
      taskId: result.insertId,
      message: "Nhiệm vụ đã được thêm",
    });
  } catch (error) {
    console.error("Lỗi khi thêm nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm nhiệm vụ",
      error: error.message,
    });
  }
});

// Cập nhật nhiệm vụ
router.put("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, type, activity, date, completed } = req.body;
    await req.dbConnection.execute(
      "UPDATE tasks SET name = ?, type = ?, activity = ?, date = ?, completed = ? WHERE id = ?",
      [name, type, activity, date, completed, taskId]
    );
    res.json({ success: true, message: "Nhiệm vụ đã được cập nhật" });
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật nhiệm vụ",
      error: error.message,
    });
  }
});

// Xóa nhiệm vụ
router.delete("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    await req.dbConnection.execute("DELETE FROM tasks WHERE id = ?", [taskId]);
    res.json({ success: true, message: "Nhiệm vụ đã được xóa" });
  } catch (error) {
    console.error("Lỗi khi xóa nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa nhiệm vụ",
      error: error.message,
    });
  }
});

// Thêm route tìm kiếm nhiệm vụ
router.get("/tasks/search/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { searchTerm } = req.query;
    const [tasks] = await req.dbConnection.execute(
      `SELECT * FROM tasks 
       WHERE user_id = ? 
       AND (name LIKE ? OR type LIKE ? OR activity LIKE ?)
       ORDER BY date`,
      [userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    const formattedTasks = tasks.map((task) => ({
      ...task,
      date: formatDate(task.date),
    }));
    res.json({ success: true, tasks: formattedTasks });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm nhiệm vụ:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm kiếm nhiệm vụ",
      error: error.message,
    });
  }
});

// Thêm route mới cho nhiệm vụ cố định
router.post("/tasks/fixed", async (req, res) => {
  try {
    const { userId, name, type, activity, date, isFixed } = req.body;
    const formattedDate = formatDate(date);

    // Kiểm tra xem nhiệm vụ cố định đã tồn tại chưa
    const [existingTasks] = await req.dbConnection.execute(
      "SELECT * FROM tasks WHERE user_id = ? AND name = ? AND type = ? AND activity = ? AND date = ? AND is_fixed = TRUE",
      [userId, name, type, activity, formattedDate]
    );

    if (existingTasks.length === 0) {
      const [result] = await req.dbConnection.execute(
        "INSERT INTO tasks (user_id, name, type, activity, date, is_fixed) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, name, type, activity, formattedDate, isFixed]
      );
      res.json({
        success: true,
        taskId: result.insertId,
        message: "Nhiệm vụ cố định đã được thêm",
      });
    } else {
      res.json({
        success: true,
        message: "Nhiệm vụ cố định đã tồn tại",
      });
    }
  } catch (error) {
    console.error("Lỗi khi thêm nhiệm vụ cố định:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm nhiệm vụ cố định",
      error: error.message,
    });
  }
});

// Thêm nhiệm vụ mới (giao việc)
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

// Lấy danh sách nhiệm vụ đã giao
router.get("/assigned-tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter } = req.query;
    let query =
      "SELECT *, DATE_FORMAT(completed_at, '%d/%m/%Y %H:%i') as formatted_completed_at, DATE_FORMAT(updated_at, '%d/%m/%Y %H:%i') as formatted_updated_at FROM assigned_tasks WHERE user_id = ?";
    const queryParams = [userId];

    if (filter === "inProgress") {
      query += " AND completed = 0 AND end_date >= CURDATE()";
    } else if (filter === "completed") {
      query += " AND completed = 1";
    } else if (filter === "overdue") {
      query += " AND completed = 0 AND end_date < CURDATE()";
    }

    query += " ORDER BY start_date";

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

// Thêm route mới để kiểm tra hoàn thành nhiệm vụ game tiếng Anh
router.get("/check-english-game-completion/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [completedTasks] = await req.dbConnection.execute(
      `
      SELECT t.id, t.user_id, t.date 
      FROM game_sessions gs 
      JOIN tasks t ON t.user_id = gs.user_id AND DATE(t.date) = DATE(gs.start_time)
      WHERE t.type = 'english' AND t.activity = 'game' AND t.user_id = ?
    `,
      [userId]
    );

    // Cập nhật trạng thái hoàn thành trong bảng tasks
    for (const task of completedTasks) {
      await req.dbConnection.execute(
        "UPDATE tasks SET completed = 1 WHERE id = ?",
        [task.id]
      );
    }

    const completedDates = completedTasks.map((task) => formatDate(task.date));

    res.json({
      success: true,
      completedDates: completedDates,
    });
  } catch (error) {
    console.error(
      "Lỗi khi kiểm tra hoàn thành nhiệm vụ game tiếng Anh:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Không thể kiểm tra hoàn thành nhiệm vụ game tiếng Anh",
      error: error.message,
    });
  }
});

// Thêm route mới để kiểm tra hoàn thành nhiệm vụ từ vựng tiếng Anh
router.get("/check-english-vocabulary-completion/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [completedTasks] = await req.dbConnection.execute(
      `
      WITH a AS (
        SELECT v.user_id, t.id, t.date
        FROM vocabulary v
        JOIN tasks t ON t.user_id = v.user_id AND DATE(t.date) = DATE(v.created_at)
        WHERE t.type = 'english' AND t.activity = 'vocabulary' AND t.user_id = ?
      )
      SELECT id, user_id, date, COUNT(*) AS count_word
      FROM a
      GROUP BY id, user_id, date
      HAVING count_word >= 10
    `,
      [userId]
    );

    // Cập nhật trạng thái hoàn thành trong bảng tasks
    for (const task of completedTasks) {
      await req.dbConnection.execute(
        "UPDATE tasks SET completed = 1 WHERE id = ?",
        [task.id]
      );
    }

    const completedDates = completedTasks.map((task) => formatDate(task.date));

    res.json({
      success: true,
      completedDates: completedDates,
    });
  } catch (error) {
    console.error(
      "Lỗi khi kiểm tra hoàn thành nhiệm vụ từ vựng tiếng Anh:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Không thể kiểm tra hoàn thành nhiệm vụ từ vựng tiếng Anh",
      error: error.message,
    });
  }
});

// Lấy nhiệm vụ của ngày hiện tại cho người dùng cụ thể
router.get("/tasks/today/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0]; // Lấy ngày hiện tại

    const [tasks] = await req.dbConnection.execute(
      "SELECT *, is_fixed AS isFixed FROM tasks WHERE user_id = ? AND date = ? ORDER BY date",
      [userId, today]
    );

    const formattedTasks = tasks.map((task) => ({
      ...task,
      date: formatDate(task.date),
    }));

    res.json({ success: true, tasks: formattedTasks });
  } catch (error) {
    console.error("Lỗi khi lấy nhiệm vụ ngày hiện tại:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy nhiệm vụ ngày hiện tại",
      error: error.message,
    });
  }
});

// Thêm route mới để lấy các nhiệm vụ sắp đến hạn
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

// Thêm route mới để cập nhật trạng thái hoàn thành của nhiệm vụ
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

// Cập nhật route lấy danh sách nhiệm vụ đã giao để bao gồm trạng thái hoàn thành
router.get("/assigned-tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [tasks] = await req.dbConnection.execute(
      "SELECT *, DATE_FORMAT(completed_at, '%d/%m/%Y %H:%i') as formatted_completed_at, DATE_FORMAT(updated_at, '%d/%m/%Y %H:%i') as formatted_updated_at FROM assigned_tasks WHERE user_id = ? ORDER BY start_date",
      [userId]
    );
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

// Thêm route mới để lấy tổng quan nhiệm vụ
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
        inProgress: overview[0].pending || 0, // Đang thực hiện được coi là đang chờ
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

// Thêm route tìm kiếm nhiệm vụ đã giao
router.get("/assigned-tasks/search/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { searchTerm } = req.query;
    const [tasks] = await req.dbConnection.execute(
      `SELECT * FROM assigned_tasks 
       WHERE user_id = ? 
       AND (task_name LIKE ? OR task_description LIKE ?)
       ORDER BY start_date`,
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

// Thêm route mới để cập nhật nhiệm vụ đã giao
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

// Thêm route để lấy thông tin chi tiết của một nhiệm vụ
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

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports = router;
