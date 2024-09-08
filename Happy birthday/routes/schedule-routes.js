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

// Thêm route mới để kiểm tra hoàn thành nhiệm vụ game tiếng Anh
router.get("/check-english-game-completion/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [completedTasks] = await req.dbConnection.execute(
      `
      SELECT t.user_id, t.date 
      FROM game_sessions gs 
      JOIN tasks t ON t.user_id = gs.user_id AND DATE(t.date) = DATE(gs.start_time)
      WHERE t.type = 'english' AND t.activity = 'game' AND t.user_id = ?
    `,
      [userId]
    );

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
        SELECT v.user_id, t.date
        FROM vocabulary v
        JOIN tasks t ON t.user_id = v.user_id AND DATE(t.date) = DATE(v.created_at)
        WHERE t.type = 'english' AND t.activity = 'vocabulary' AND t.user_id = ?
      )
      SELECT user_id, date, COUNT(*) AS count_word
      FROM a
      GROUP BY user_id, date
      HAVING count_word >= 10
    `,
      [userId]
    );

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

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports = router;
