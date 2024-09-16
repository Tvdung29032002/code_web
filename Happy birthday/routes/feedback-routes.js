const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Middleware xác thực
const authMiddleware = (req, res, next) => {
  const userId = req.body.userId;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Người dùng chưa đăng nhập." });
  }
  req.userId = userId;
  next();
};

// Áp dụng middleware xác thực cho route POST /feedback
router.post("/feedback", authMiddleware, async (req, res) => {
  const { rating, category, content } = req.body;
  const userId = req.userId; // Lấy userId từ middleware

  // Kiểm tra xem có đủ thông tin không
  if (!rating || !category || !content) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu thông tin đánh giá." });
  }

  try {
    const [result] = await req.dbConnection.execute(
      "INSERT INTO feedback (user_id, rating, category, content) VALUES (?, ?, ?, ?)",
      [userId, rating, category, content]
    );

    console.log("Feedback đã được lưu:", result);

    res.json({
      success: true,
      message: "Đánh giá đã được gửi thành công.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi khi lưu feedback:", error);
    res
      .status(500)
      .json({ success: false, message: "Có lỗi xảy ra khi lưu đánh giá." });
  }
});

router.get("/feedback", async (req, res) => {
  const { category, sort, search } = req.query;

  let query = `
    SELECT f.id, f.rating, f.category, f.content, u.username, 
    COALESCE((SELECT COUNT(*) FROM helpful_votes WHERE feedback_id = f.id), 0) as helpful_count,
    f.created_at
    FROM feedback f 
    JOIN users u ON f.user_id = u.id
  `;
  const params = [];

  let whereClause = [];

  if (category && category !== "") {
    whereClause.push("f.category = ?");
    params.push(category);
  }

  if (search && search !== "") {
    whereClause.push("(f.content LIKE ? OR u.username LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (whereClause.length > 0) {
    query += " WHERE " + whereClause.join(" AND ");
  }

  switch (sort) {
    case "oldest":
      query += " ORDER BY f.created_at ASC";
      break;
    case "highest":
      query += " ORDER BY f.rating DESC, helpful_count DESC";
      break;
    case "lowest":
      query += " ORDER BY f.rating ASC, helpful_count DESC";
      break;
    case "most_helpful":
      query += " ORDER BY helpful_count DESC, f.created_at DESC";
      break;
    default:
      query += " ORDER BY f.created_at DESC";
  }

  try {
    console.log("Query:", query);
    console.log("Params:", params);

    const [rows] = await req.dbConnection.execute(query, params);

    console.log("Rows:", rows);

    res.json({ success: true, feedback: rows });
  } catch (error) {
    console.error("Lỗi chi tiết khi lấy feedback:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy feedback.",
      error: error.message,
    });
  }
});

router.post("/feedback/:id/helpful", async (req, res) => {
  const feedbackId = req.params.id;
  const userId = req.body.userId; // Giả sử bạn đã có middleware xác thực

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Người dùng chưa đăng nhập." });
  }

  try {
    // Kiểm tra xem người dùng đã đánh giá hữu ích cho feedback này chưa
    const [existingVote] = await req.dbConnection.execute(
      "SELECT * FROM helpful_votes WHERE feedback_id = ? AND user_id = ?",
      [feedbackId, userId]
    );

    if (existingVote.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá hữu ích cho feedback này rồi.",
      });
    }

    // Nếu chưa đánh giá, thêm vào bảng helpful_votes
    await req.dbConnection.execute(
      "INSERT INTO helpful_votes (feedback_id, user_id) VALUES (?, ?)",
      [feedbackId, userId]
    );

    res.json({ success: true, message: "Đã đánh dấu là hữu ích." });
  } catch (error) {
    console.error("Lỗi khi đánh dấu hữu ích:", error);
    res
      .status(500)
      .json({ success: false, message: "Có lỗi xảy ra khi đánh dấu hữu ích." });
  }
});

module.exports = router;
