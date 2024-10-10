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
    // Kiểm tra xem nhiệm vụ có phải là nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame không
    const [task] = await req.dbConnection.execute(
      "SELECT is_fixed, type, activity FROM tasks WHERE id = ?",
      [taskId]
    );

    if (
      task.length > 0 &&
      task[0].is_fixed &&
      task[0].type === "english" &&
      (task[0].activity === "vocabulary" || task[0].activity === "game")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Không thể cập nhật nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame",
      });
    }

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
    // Kiểm tra xem nhiệm vụ có phải là nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame không
    const [task] = await req.dbConnection.execute(
      "SELECT is_fixed, type, activity FROM tasks WHERE id = ?",
      [taskId]
    );

    if (
      task.length > 0 &&
      task[0].is_fixed &&
      task[0].type === "english" &&
      (task[0].activity === "vocabulary" || task[0].activity === "game")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Không thể xóa nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame",
      });
    }

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

// Tìm kiếm nhiệm vụ
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

// Thêm nhiệm vụ cố định
router.post("/tasks/fixed", async (req, res) => {
  try {
    const { userId, name, type, activity, date, isFixed } = req.body;
    const formattedDate = formatDate(date);

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

// Routes cho việc kiểm tra hoàn thành nhiệm vụ game và từ vựng tiếng Anh
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

// Lấy nhiệm vụ của ngày hiện tại
router.get("/tasks/today/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

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

module.exports = router;
