const express = require("express");
const router = express.Router();
const { syncToGoogleSheets } = require("./googleSheetsSync");

// Add vocabulary route
router.post("/add-vocabulary", async (req, res) => {
  try {
    const { word, meaning, phonetic, part_of_speech, example } = req.body;

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
      "INSERT INTO vocabulary (word, meaning, phonetic, part_of_speech, example) VALUES (?, ?, ?, ?, ?)",
      [word, meaning, phonetic, part_of_speech, example]
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
      "UPDATE vocabulary SET word = ?, meaning = ?, phonetic = ?, part_of_speech = ?, example = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [word, meaning, phonetic, part_of_speech, example, id]
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

    const [result] = await req.dbConnection.execute(
      "UPDATE vocabulary SET is_active = FALSE WHERE id = ?",
      [id]
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

// Add Chinese vocabulary route
router.post("/add-chinese-vocabulary", async (req, res) => {
  try {
    const { character, pinyin, meaning, example } = req.body;

    if (!character || !pinyin || !meaning) {
      return res.status(400).json({
        success: false,
        message: "Character, pinyin, and meaning are required",
      });
    }

    // Check if the character already exists, including soft-deleted words
    const [existingChars] = await req.dbConnection.execute(
      "SELECT * FROM chinese_vocabulary WHERE `character` = ?",
      [character]
    );

    if (existingChars.length > 0) {
      const existingChar = existingChars[0];
      if (existingChar.is_active) {
        return res.status(400).json({
          success: false,
          message: "This character already exists in the database",
        });
      } else {
        // If the character was soft-deleted, reactivate and update its information
        await req.dbConnection.execute(
          "UPDATE chinese_vocabulary SET pinyin = ?, meaning = ?, example = ?, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [pinyin, meaning, example, existingChar.id]
        );

        return res.json({
          success: true,
          message: "Character has been reactivated and updated successfully",
          id: existingChar.id,
        });
      }
    }

    // If the character doesn't exist, add it
    const [result] = await req.dbConnection.execute(
      "INSERT INTO chinese_vocabulary (`character`, pinyin, meaning, example) VALUES (?, ?, ?, ?)",
      [character, pinyin, meaning, example]
    );

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

// Get Chinese vocabulary route
router.get("/chinese-vocabulary", async (req, res) => {
  try {
    console.log("Received request for Chinese vocabulary");
    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM chinese_vocabulary WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10"
    );
    console.log("Fetched vocabulary:", rows.length, "items");
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching Chinese vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch Chinese vocabulary list",
      error: error.message,
    });
  }
});

// Update Chinese vocabulary route
router.put("/update-chinese-vocabulary", async (req, res) => {
  try {
    const { id, character, pinyin, meaning, example } = req.body;

    // Validate input
    if (!id || !character || !pinyin || !meaning) {
      return res.status(400).json({
        success: false,
        message: "Id, character, pinyin, and meaning are required",
      });
    }

    // Use a default value for example if it's undefined
    const safeExample = example || "";

    const [result] = await req.dbConnection.execute(
      "UPDATE chinese_vocabulary SET `character` = ?, pinyin = ?, meaning = ?, example = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [character, pinyin, meaning, safeExample, id]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Chinese vocabulary has been updated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Chinese vocabulary not found",
      });
    }
  } catch (error) {
    console.error("Error updating Chinese vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update Chinese vocabulary",
      error: error.message,
    });
  }
});
// Delete Chinese vocabulary route (soft delete)
router.delete("/delete-chinese-vocabulary/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await req.dbConnection.execute(
      "UPDATE chinese_vocabulary SET is_active = FALSE WHERE id = ?",
      [id]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Chinese vocabulary has been deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Chinese vocabulary not found",
      });
    }
  } catch (error) {
    console.error("Error deleting Chinese vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete Chinese vocabulary",
      error: error.message,
    });
  }
});

// Get daily character
router.get("/daily-character", async (req, res) => {
  try {
    console.log("Fetching daily character...");
    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM chinese_vocabulary WHERE is_active = TRUE ORDER BY RAND() LIMIT 1"
    );
    console.log("Query result:", rows);

    if (rows.length > 0) {
      res.json({
        success: true,
        character: rows[0].character,
        pinyin: rows[0].pinyin,
        meaning: rows[0].meaning,
      });
    } else {
      // Nếu không tìm thấy ký tự nào, trả về một ký tự mặc định
      res.json({
        success: true,
        character: "你",
        pinyin: "nǐ",
        meaning: "you",
      });
    }
  } catch (error) {
    console.error("Error fetching daily character:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch daily character",
      error: error.message,
    });
  }
});

// Search Chinese vocabulary route
router.get("/search-chinese-vocabulary", async (req, res) => {
  console.log("Received search request for Chinese vocabulary");
  try {
    const searchTerm = req.query.term;
    console.log("Search term:", searchTerm);

    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM chinese_vocabulary WHERE `character` LIKE ? OR pinyin LIKE ? OR meaning LIKE ? AND is_active = TRUE ORDER BY created_at DESC",
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );

    console.log("Search results:", rows.length, "items");
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching Chinese vocabulary:", error);
    res.status(500).json({
      success: false,
      message: "Unable to search Chinese vocabulary",
      error: error.message,
    });
  }
});

// Thêm route mới để lấy câu hỏi ngẫu nhiên cho trò chơi
router.get("/random-china-vocabulary", async (req, res) => {
  try {
    // Lấy một từ vựng ngẫu nhiên
    const [mainWord] = await req.dbConnection.execute(
      "SELECT * FROM chinese_vocabulary WHERE is_active = TRUE ORDER BY RAND() LIMIT 1"
    );

    // Lấy 3 từ vựng khác làm nhiễu
    const [distractors] = await req.dbConnection.execute(
      "SELECT meaning FROM chinese_vocabulary WHERE is_active = TRUE AND id != ? ORDER BY RAND() LIMIT 3",
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

// Thêm route mới để lấy câu hỏi ngẫu nhiên cho trò chơi
router.get("/random-english-vocabulary", async (req, res) => {
  try {
    // Lấy một từ vựng ngẫu nhiên
    const [mainWord] = await req.dbConnection.execute(
      "SELECT * FROM vocabulary WHERE is_active = TRUE ORDER BY RAND() LIMIT 1"
    );

    // Lấy 3 từ vựng khác làm nhiễu
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
module.exports = router;
