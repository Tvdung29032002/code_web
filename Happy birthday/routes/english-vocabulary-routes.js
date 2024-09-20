const express = require("express");
const router = express.Router();
const { syncToGoogleSheets } = require("../googleSheetsSync");

// Add vocabulary route
router.post("/add-vocabulary", async (req, res) => {
  try {
    const { word, meaning, phonetic, part_of_speech, example } = req.body;
    const userId = req.body.userId; // Lấy userId từ request body

    if (!word || !meaning || !phonetic || !part_of_speech || !example) {
      return res.status(400).json({
        success: false,
        message: "Từ, nghĩa, phiên âm, từ loại và ví dụ không được để trống",
      });
    }

    // Check if the word already exists, including soft-deleted words
    const [existingWords] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE word = ?",
      [word]
    );

    if (existingWords.length > 0) {
      const existingWord = existingWords[0];
      if (existingWord.is_active) {
        return res.status(400).json({
          success: false,
          message: "Từ này đã tồn tại trong cơ sở dữ liệu",
        });
      } else {
        // If the word was soft-deleted, reactivate and update its information
        await req.dbConnection.execute(
          "UPDATE vocabulary SET meaning = ?, phonetic = ?, part_of_speech = ?, example = ?, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [meaning, phonetic, part_of_speech, example, existingWord.id]
        );

        // Sync data with Google Sheets
        await syncToGoogleSheets(req.dbConnection);

        return res.json({
          success: true,
          message: "Từ vựng đã được kích hoạt lại và cập nhật thành công",
          id: existingWord.id,
        });
      }
    }

    // If the word doesn't exist, add it
    const [result] = await req.dbConnection.execute(
      "INSERT INTO vocabulary (word, meaning, phonetic, part_of_speech, example, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [word, meaning, phonetic, part_of_speech, example, userId]
    );

    // Sync data with Google Sheets
    await syncToGoogleSheets(req.dbConnection);

    res.json({
      success: true,
      message: "Từ vựng đã được thêm thành công",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm từ vựng",
      error: error.message,
    });
  }
});

// Search vocabulary route
router.get("/search-vocabulary", async (req, res) => {
  console.log("Received search request");
  try {
    const searchTerm = req.query.term;
    console.log("Search term:", searchTerm);

    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE word LIKE ? AND is_active = TRUE ORDER BY created_at DESC",
      [`%${searchTerm}%`]
    );

    console.log("Search results:", rows.length, "items");
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm kiếm từ vựng",
      error: error.message,
    });
  }
});

// Get vocabulary route
router.get("/vocabulary", async (req, res) => {
  console.log("Received request for vocabulary");
  try {
    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10"
    );
    console.log("Fetched vocabulary:", rows.length, "items");
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách từ vựng",
      error: error.message,
    });
  }
});

// Update vocabulary route
router.put("/update-vocabulary", async (req, res) => {
  try {
    const { id, word, meaning, phonetic, part_of_speech, example } = req.body;
    const userId = req.body.userId; // Lấy userId từ request body

    const [existingWord] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE id = ?",
      [id]
    );

    if (existingWord.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy từ vựng để cập nhật",
      });
    }

    const [result] = await req.dbConnection.execute(
      "UPDATE vocabulary SET word = ?, meaning = ?, phonetic = ?, part_of_speech = ?, example = ? WHERE id = ? AND user_id = ?",
      [word, meaning, phonetic, part_of_speech, example, id, userId]
    );

    // Sync data with Google Sheets
    await syncToGoogleSheets(req.dbConnection);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Từ vựng đã được cập nhật thành công",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật từ vựng",
      });
    }
  } catch (error) {
    console.error("Error updating vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật từ vựng",
      error: error.message,
    });
  }
});

// Delete vocabulary route (soft delete)
router.delete("/delete-vocabulary/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId; // Lấy userId từ request body

    const [result] = await req.dbConnection.execute(
      "UPDATE vocabulary SET is_active = FALSE WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    // Sync data with Google Sheets
    await syncToGoogleSheets(req.dbConnection);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Từ vựng đã được xóa thành công",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy từ vựng để xóa",
      });
    }
  } catch (error) {
    console.error("Error deleting vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa từ vựng",
      error: error.message,
    });
  }
});

// Get random English vocabulary for game
router.get("/random-english-vocabulary", async (req, res) => {
  try {
    // Get a random vocabulary
    const [mainWord] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE is_active = TRUE ORDER BY RAND() LIMIT 1"
    );

    // Get 3 other vocabularies as distractors
    const [distractors] = await req.dbConnection.execute(
      "SELECT meaning FROM vocabulary WHERE is_active = TRUE AND id != ? ORDER BY RAND() LIMIT 3",
      [mainWord[0].id]
    );

    res.json({
      success: true,
      vocabulary: mainWord[0],
      distractors: distractors.map((d) => d.meaning),
    });
  } catch (error) {
    console.error("Error fetching random vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch random vocabulary",
      error: error.message,
    });
  }
});

// Cập nhật route kết thúc trò chơi và lưu điểm
router.post("/end-game", async (req, res) => {
  try {
    const { userId, score } = req.body;

    if (!userId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "UserId và score là bắt buộc",
      });
    }

    // Lưu điểm số vào bảng scores
    const [result] = await req.dbConnection.execute(
      "INSERT INTO scores (user_id, score) VALUES (?, ?)",
      [userId, score]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Điểm số đã được lưu thành công",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Không thể lưu điểm số",
      });
    }
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lưu điểm số",
      error: error.message,
    });
  }
});

// Thêm route mới để lấy bảng xếp hạng
router.get("/leaderboard", async (req, res) => {
  try {
    const [rows] = await req.dbConnection.execute(`
      SELECT CONCAT(u.firstName, ' ', u.lastName) as username, s.score as max_score, s.created_at as play_time
      FROM users u
      JOIN scores s ON u.id = s.user_id
      ORDER BY max_score DESC
      LIMIT 5 
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy bảng xếp hạng",
      error: error.message,
    });
  }
});

// Thêm route mới để lấy tên người dùng
router.get("/user-info", async (req, res) => {
  try {
    // Giả sử bạn đã có userId từ phiên đăng nhập
    const userId = req.query.userId; // Hoặc lấy từ token nếu bạn sử dụng authentication

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId là bắt buộc",
      });
    }

    const [rows] = await req.dbConnection.execute(
      "SELECT CONCAT(firstName, ' ', lastName) AS fullName FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length > 0) {
      res.json({
        success: true,
        fullName: rows[0].fullName,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin người dùng",
      error: error.message,
    });
  }
});

// Sửa đổi route lấy top các câu trả lời sai
router.get("/top-incorrect-answers", async (req, res) => {
  try {
    const [rows] = await req.dbConnection.execute(`
      SELECT v.word, v.meaning, ia.count as incorrect_count
      FROM incorrect_answers ia
      JOIN vocabulary v ON ia.vocabulary_id = v.id
      ORDER BY ia.count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: rows.map((row) => ({
        word: row.word,
        meaning: row.meaning,
        count: row.incorrect_count, // Đảm bảo sử dụng tên đúng của cột
      })),
    });
  } catch (error) {
    console.error("Lỗi khi lấy top các câu trả lời sai:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy top các câu trả lời sai",
      error: error.message,
    });
  }
});

// Thêm route mới để cập nhật số lần trả lời sai
router.post("/update-incorrect-answer", async (req, res) => {
  try {
    const { vocabularyId } = req.body;

    if (!vocabularyId) {
      return res.status(400).json({
        success: false,
        message: "vocabularyId là bắt buộc",
      });
    }

    // Kiểm tra xem từ vựng có tồn tại không
    const [vocabularyExists] = await req.dbConnection.execute(
      "SELECT id FROM vocabulary WHERE id = ?",
      [vocabularyId]
    );

    if (vocabularyExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy từ vựng",
      });
    }

    // Kiểm tra xem đã có bản ghi cho từ vựng này chưa
    const [existingRecord] = await req.dbConnection.execute(
      "SELECT id, count FROM incorrect_answers WHERE vocabulary_id = ?",
      [vocabularyId]
    );

    let result;
    if (existingRecord.length > 0) {
      // Nếu đã có bản ghi, cập nhật count
      const newCount = existingRecord[0].count + 1;
      [result] = await req.dbConnection.execute(
        "UPDATE incorrect_answers SET count = ? WHERE id = ?",
        [newCount, existingRecord[0].id]
      );
    } else {
      // Nếu chưa có bản ghi, thêm mới
      [result] = await req.dbConnection.execute(
        "INSERT INTO incorrect_answers (vocabulary_id, count) VALUES (?, 1)",
        [vocabularyId]
      );
    }

    res.json({
      success: true,
      message: "Đã cập nhật số lần trả lời sai",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật số lần trả lời sai:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật số lần trả lời sai",
      error: error.message,
    });
  }
});

module.exports = router;
