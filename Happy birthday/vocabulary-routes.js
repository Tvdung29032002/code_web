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

module.exports = router;
