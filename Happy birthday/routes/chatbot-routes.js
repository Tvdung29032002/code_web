const express = require("express");
const router = express.Router();

router.post("/chatbot-responses", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Thiếu tham số message" });
    }

    const query = `
      SELECT response FROM chatbot_responses
      WHERE LOWER(keywords) LIKE CONCAT('%', LOWER(?), '%')
      LIMIT 1
    `;

    const [rows] = await req.dbConnection.execute(query, [message]);

    if (rows.length > 0) {
      res.json({
        response: rows[0].response,
        actions: [],
      });
    } else {
      const suggestedQuestions = [
        "Bạn có thể giúp gì cho tôi?",
        "Làm thế nào để đặt câu hỏi?",
        "Thông tin liên hệ",
      ];
      res.json({
        response:
          "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi điều gì khác không?",
        actions: [
          {
            type: "suggestQuestions",
            data: suggestedQuestions,
          },
        ],
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn chatbot:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
