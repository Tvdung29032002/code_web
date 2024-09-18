const express = require("express");
const router = express.Router();

// Lưu tin nhắn
router.post("/messages", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  try {
    const [result] = await req.dbConnection.execute(
      "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
      [sender_id, receiver_id, content]
    );
    res.json({ success: true, message_id: result.insertId });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lưu tin nhắn" });
  }
});

// Lấy tin nhắn
router.get("/messages/:user1_id/:user2_id", async (req, res) => {
  const { user1_id, user2_id } = req.params;
  try {
    const [rows] = await req.dbConnection.execute(
      "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp ASC",
      [user1_id, user2_id, user2_id, user1_id]
    );
    res.json({ success: true, messages: rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy tin nhắn" });
  }
});

// Lấy danh sách người dùng trừ người dùng hiện tại
router.get("/chat-users/:currentUserId", async (req, res) => {
  const { currentUserId } = req.params;
  try {
    const [rows] = await req.dbConnection.execute(
      `
      SELECT u.id, u.username, CONCAT(u.firstName, ' ', u.lastName) AS name, 
             pi.photo_url, pi.bio, pi.phone,
             COALESCE(cdn.display_name, CONCAT(u.firstName, ' ', u.lastName)) AS display_name,
             FALSE as is_group
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN chat_display_names cdn ON u.id = cdn.chat_id AND cdn.user_id = ? AND cdn.is_group = FALSE
      WHERE u.id != ?
      UNION ALL
      SELECT gc.id, NULL as username, gc.name, 
             '/uploads/group-message-default.png' as photo_url, 
             'Nhóm chat cho tất cả người dùng' as bio, 
             NULL as phone,
             COALESCE(cdn.display_name, gc.name) as display_name,
             TRUE as is_group
      FROM group_chats gc
      LEFT JOIN chat_display_names cdn ON gc.id = cdn.chat_id AND cdn.user_id = ? AND cdn.is_group = TRUE
      WHERE gc.name = 'Nhóm chat chung'
    `,
      [currentUserId, currentUserId, currentUserId]
    );
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error("Error fetching chat users:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách người dùng chat",
    });
  }
});

// Tạo hoặc lấy nhóm chat duy nhất
router.post("/create-or-get-group-chat", async (req, res) => {
  try {
    const [existingGroup] = await req.dbConnection.execute(
      "SELECT * FROM group_chats WHERE name = 'Nhóm chat chung' LIMIT 1"
    );

    let groupId;
    if (existingGroup.length > 0) {
      groupId = existingGroup[0].id;
    } else {
      // Tạo nhóm chat mới
      const [result] = await req.dbConnection.execute(
        "INSERT INTO group_chats (name, creator_id) VALUES (?, ?)",
        ["Nhóm chat chung", req.body.creator_id]
      );
      groupId = result.insertId;
      console.log("Nhóm chat mới được tạo với ID:", groupId);

      // Thêm tất cả người dùng vào nhóm chat
      const [users] = await req.dbConnection.execute("SELECT id FROM users");
      for (const user of users) {
        await req.dbConnection.execute(
          "INSERT INTO group_chat_members (group_id, user_id) VALUES (?, ?)",
          [groupId, user.id]
        );
      }
      console.log("Đã thêm tất cả người dùng vào nhóm chat");
    }

    // Đảm bảo người dùng hiện tại được thêm vào nhóm
    const [memberCheck] = await req.dbConnection.execute(
      "SELECT * FROM group_chat_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.body.creator_id]
    );
    if (memberCheck.length === 0) {
      await req.dbConnection.execute(
        "INSERT INTO group_chat_members (group_id, user_id) VALUES (?, ?)",
        [groupId, req.body.creator_id]
      );
      console.log("Đã thêm người dùng hiện tại vào nhóm chat");
    }

    res.json({
      success: true,
      groupChat: { id: groupId, name: "Nhóm chat chung" },
    });
  } catch (error) {
    console.error("Lỗi khi tạo hoặc lấy nhóm chat:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo hoặc lấy nhóm chat",
      error: error.message,
    });
  }
});

// Lấy tin nhắn nhóm
router.get("/group-messages/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const [rows] = await req.dbConnection.execute(
      `SELECT m.*, CONCAT(u.firstName, ' ', u.lastName) AS sender_name
       FROM group_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.group_id = ?
       ORDER BY m.timestamp ASC`,
      [groupId]
    );
    res.json({ success: true, messages: rows });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn nhóm:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy tin nhắn nhóm" });
  }
});

// Thêm route mới để gửi tin nhắn nhóm
router.post("/group-messages", async (req, res) => {
  const { sender_id, group_id, content } = req.body;
  console.log("Received group message request:", {
    sender_id,
    group_id,
    content,
  });
  try {
    // Kiểm tra xem người dùng có trong nhóm không
    const [memberCheck] = await req.dbConnection.execute(
      "SELECT * FROM group_chat_members WHERE group_id = ? AND user_id = ?",
      [group_id, sender_id]
    );
    console.log("Member check result:", memberCheck);

    if (memberCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Người dùng không thuộc nhóm chat này",
      });
    }

    const [result] = await req.dbConnection.execute(
      "INSERT INTO group_messages (sender_id, group_id, content) VALUES (?, ?, ?)",
      [sender_id, group_id, content]
    );
    res.json({ success: true, message_id: result.insertId });
  } catch (error) {
    console.error("Lỗi khi lưu tin nhắn nhóm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu tin nhắn nhóm",
      error: error.message,
    });
  }
});

// Cập nhật tên hiển thị cho cuộc trò chuyện
router.post("/update-chat-display-name", async (req, res) => {
  const { user_id, chat_id, display_name, is_group } = req.body;
  try {
    await req.dbConnection.execute(
      `INSERT INTO chat_display_names (user_id, chat_id, display_name, is_group) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE display_name = ?`,
      [user_id, chat_id, display_name, is_group, display_name]
    );
    res.json({ success: true, message: "Tên hiển thị đã được cập nhật" });
  } catch (error) {
    console.error("Lỗi khi cập nhật tên hiển thị:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật tên hiển thị" });
  }
});

module.exports = router;
