const express = require("express");
const router = express.Router();

// Lấy danh sách chủ đề
router.get("/topics", async (req, res) => {
  try {
    const category = req.query.category;
    const keyword = req.query.keyword;
    const sortBy = req.query.sortBy || "newest";
    let query = `
      SELECT t.*, u.username, COUNT(p.id) as reply_count
      FROM topics t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN posts p ON t.id = p.topic_id
      WHERE 1=1
    `;

    const queryParams = [];
    if (category && category !== "Tất cả chủ đề") {
      query += " AND t.category = ?";
      queryParams.push(category);
    }

    if (keyword) {
      query += " AND t.title LIKE ?";
      queryParams.push(`%${keyword}%`);
    }

    query += ` GROUP BY t.id `;

    switch (sortBy) {
      case "most-viewed":
        query += ` ORDER BY t.view_count DESC`;
        break;
      case "most-replied":
        query += ` ORDER BY reply_count DESC`;
        break;
      case "newest":
      default:
        query += ` ORDER BY t.created_at DESC`;
    }

    const [rows] = await req.dbConnection.execute(query, queryParams);
    res.json({ success: true, topics: rows });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chủ đề:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Tạo chủ đề mới
router.post("/topics", async (req, res) => {
  const { title, content, category, userId } = req.body;
  try {
    const [result] = await req.dbConnection.execute(
      "INSERT INTO topics (title, content, category, user_id) VALUES (?, ?, ?, ?)",
      [title, content, category, userId]
    );
    res.json({ success: true, topicId: result.insertId });
  } catch (error) {
    console.error("Lỗi khi tạo chủ đề mới:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Lấy chi tiết chủ đề và các bài viết
router.get("/topics/:id", async (req, res) => {
  const topicId = req.params.id;
  try {
    const [[topic]] = await req.dbConnection.execute(
      "SELECT t.*, u.username FROM topics t JOIN users u ON t.user_id = u.id WHERE t.id = ?",
      [topicId]
    );
    const [posts] = await req.dbConnection.execute(
      "SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.topic_id = ? ORDER BY p.created_at",
      [topicId]
    );
    res.json({ success: true, topic, posts });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết chủ đề:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Thêm bài viết mới
router.post("/posts", async (req, res) => {
  const { topicId, content, userId } = req.body;
  try {
    const [result] = await req.dbConnection.execute(
      "INSERT INTO posts (topic_id, content, user_id) VALUES (?, ?, ?)",
      [topicId, content, userId]
    );
    res.json({ success: true, postId: result.insertId });
  } catch (error) {
    console.error("Lỗi khi thêm bài viết mới:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Thêm route mới để tăng lượt xem
router.post("/topics/:id/view", async (req, res) => {
  const topicId = req.params.id;
  try {
    await req.dbConnection.execute(
      "UPDATE topics SET view_count = view_count + 1 WHERE id = ?",
      [topicId]
    );
    res.json({ success: true, message: "Đã tăng lượt xem" });
  } catch (error) {
    console.error("Lỗi khi tăng lượt xem:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
