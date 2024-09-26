const express = require("express");
const router = express.Router();

// Lưu tin nhắn
router.post("/messages", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  try {
    if (!sender_id || !receiver_id || !content) {
      throw new Error("Thiếu thông tin cần thiết");
    }
    const [result] = await req.dbConnection.execute(
      "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
      [sender_id, receiver_id, content]
    );

    // Cập nhật last_activity
    await req.dbConnection.execute(
      "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?",
      [sender_id]
    );

    res.json({ success: true, message_id: result.insertId });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lưu tin nhắn",
      error: error.message,
    });
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
             FALSE as is_group, u.online_status
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
             TRUE as is_group,
             TRUE as online_status
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

// Cập nhật trạng thái trực tuyến
router.post("/update-online-status", async (req, res) => {
  const { user_id, online_status } = req.body;
  try {
    await req.dbConnection.execute(
      "UPDATE users SET online_status = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?",
      [online_status, user_id]
    );
    res.json({ success: true, message: "Đã cập nhật trạng thái trực tuyến" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái trực tuyến:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái trực tuyến",
    });
  }
});

// Lấy trạng thái trực tuyến của người dùng
router.post("/update-last-activity", express.json(), async (req, res) => {
  const { user_id } = req.body;
  try {
    await req.dbConnection.execute(
      "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?",
      [user_id]
    );
    res
      .status(200)
      .json({ success: true, message: "Đã cập nhật last_activity" });
  } catch (error) {
    console.error("Lỗi khi cập nhật last_activity:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật last_activity" });
  }
});

router.post("/update-last-activity", express.json(), async (req, res) => {
  const { user_id } = req.body;
  try {
    await req.dbConnection.execute(
      "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?",
      [user_id]
    );
    res
      .status(200)
      .json({ success: true, message: "Đã cập nhật last_activity" });
  } catch (error) {
    console.error("Lỗi khi cập nhật last_activity:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật last_activity" });
  }
});

router.get("/online-status/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await req.dbConnection.execute(
      "SELECT online_status, last_activity FROM users WHERE id = ?",
      [user_id]
    );
    if (rows.length > 0) {
      const now = new Date();
      const lastActivity = new Date(rows[0].last_activity);
      const timeDiff = (now - lastActivity) / 1000 / 60; // Chuyển đổi thành phút
      const isOnline = rows[0].online_status && timeDiff <= 5;
      res.json({ success: true, online_status: isOnline });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái trực tuyến:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy trạng thái trực tuyến" });
  }
});

// Thêm người dùng vào nhóm chat chung
router.post("/add-user-to-common-group", async (req, res) => {
  const { user_id } = req.body;
  try {
    // Lấy ID của nhóm chat chung
    const [groupRows] = await req.dbConnection.execute(
      "SELECT id FROM group_chats WHERE name = 'Nhóm chat chung' LIMIT 1"
    );

    let groupId;
    if (groupRows.length === 0) {
      // Nếu nhóm chat chung chưa tồn tại, tạo mới
      const [result] = await req.dbConnection.execute(
        "INSERT INTO group_chats (name, creator_id) VALUES (?, ?)",
        ["Nhóm chat chung", user_id]
      );
      groupId = result.insertId;
      console.log("Đã tạo nhóm chat chung mới với ID:", groupId);
    } else {
      groupId = groupRows[0].id;
    }

    // Kiểm tra xem người dùng đã trong nhóm chưa
    const [memberCheck] = await req.dbConnection.execute(
      "SELECT * FROM group_chat_members WHERE group_id = ? AND user_id = ?",
      [groupId, user_id]
    );

    if (memberCheck.length === 0) {
      // Thêm người dùng vào nhóm nếu chưa là thành viên
      await req.dbConnection.execute(
        "INSERT INTO group_chat_members (group_id, user_id) VALUES (?, ?)",
        [groupId, user_id]
      );
      res.json({
        success: true,
        message: "Đã thêm người dùng vào nhóm chat chung",
      });
    } else {
      res.json({
        success: true,
        message: "Người dùng đã là thành viên của nhóm chat chung",
      });
    }
  } catch (error) {
    console.error("Lỗi khi thêm người dùng vào nhóm chat chung:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm người dùng vào nhóm chat chung",
      error: error.message,
    });
  }
});

// Kiểm tra tin nhắn mới
router.get("/check-new-messages/:userId/:lastMessageId", async (req, res) => {
  const { userId, lastMessageId } = req.params;
  try {
    const [personalMessages] = await req.dbConnection.execute(
      `SELECT m.*, CONCAT(u.firstName, ' ', u.lastName) AS sender_name, NULL as group_id
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id > ? AND (m.sender_id = ? OR m.receiver_id = ?)
       ORDER BY m.timestamp ASC`,
      [lastMessageId, userId, userId]
    );

    const [groupMessages] = await req.dbConnection.execute(
      `SELECT m.*, CONCAT(u.firstName, ' ', u.lastName) AS sender_name, m.group_id
       FROM group_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id > ? AND m.group_id IN (
         SELECT group_id FROM group_chat_members WHERE user_id = ?
       )
       ORDER BY m.timestamp ASC`,
      [lastMessageId, userId]
    );

    const allMessages = [...personalMessages, ...groupMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    res.json({ success: true, messages: allMessages });
  } catch (error) {
    console.error("Lỗi khi kiểm tra tin nhắn mới:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi kiểm tra tin nhắn mới" });
  }
});

// Thêm route mới để lấy trạng thái online của các thành viên trong nhóm
router.get("/group-online-status/:groupId/:currentUserId", async (req, res) => {
  const { groupId, currentUserId } = req.params;
  try {
    const [members] = await req.dbConnection.execute(
      `SELECT u.id, u.online_status, u.last_activity
       FROM users u
       JOIN group_chat_members gcm ON u.id = gcm.user_id
       WHERE gcm.group_id = ? AND u.id != ?`,
      [groupId, currentUserId]
    );

    const now = new Date();
    const onlineUsers = members
      .filter((member) => {
        const lastActivity = new Date(member.last_activity);
        const timeDiff = (now - lastActivity) / 1000 / 60; // Chuyển đổi thành phút
        return member.online_status && timeDiff <= 5;
      })
      .map((member) => member.id);

    res.json({ success: true, onlineUsers });
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái online của nhóm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy trạng thái online của nhóm",
    });
  }
});

// Đánh dấu tin nhắn đã đọc
router.post("/mark-messages-as-read", async (req, res) => {
  const { user_id, other_user_id, group_id } = req.body;
  try {
    if (group_id) {
      // Đánh dấu tin nhắn nhóm đã đọc
      await req.dbConnection.execute(
        "UPDATE group_messages SET is_read = TRUE WHERE group_id = ? AND sender_id != ?",
        [group_id, user_id]
      );
    } else {
      // Đánh dấu tin nhắn cá nhân đã đọc
      await req.dbConnection.execute(
        "UPDATE messages SET is_read = TRUE WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
        [other_user_id, user_id, user_id, other_user_id]
      );
    }
    res.json({ success: true, message: "Đã đánh dấu tin nhắn là đã đọc" });
  } catch (error) {
    console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi đánh dấu tin nhắn đã đọc" });
  }
});

// Lấy số lượng tin nhắn chưa đọc
router.get("/unread-messages-count/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [personalCount] = await req.dbConnection.execute(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE",
      [user_id]
    );
    const [groupCount] = await req.dbConnection.execute(
      `SELECT COUNT(*) as count FROM group_messages 
       WHERE group_id IN (SELECT group_id FROM group_chat_members WHERE user_id = ?) 
       AND sender_id != ? AND is_read = FALSE`,
      [user_id, user_id]
    );
    const totalCount = personalCount[0].count + groupCount[0].count;
    res.json({ success: true, unreadCount: totalCount });
  } catch (error) {
    console.error("Lỗi khi lấy số lượng tin nhắn chưa đọc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy số lượng tin nhắn chưa đọc",
    });
  }
});

// Đánh dấu tin nhắn đã xem
router.post("/mark-messages-as-seen", async (req, res) => {
  const { user_id, other_user_id, group_id } = req.body;
  try {
    let updatedMessageIds = [];
    if (group_id) {
      await req.dbConnection.execute(
        "UPDATE group_messages SET is_seen = TRUE WHERE group_id = ? AND sender_id != ? AND is_seen = FALSE",
        [group_id, user_id]
      );
      const [result] = await req.dbConnection.execute(
        "SELECT id FROM group_messages WHERE group_id = ? AND sender_id != ? AND is_seen = TRUE",
        [group_id, user_id]
      );
      updatedMessageIds = result.map((row) => row.id);
    } else {
      await req.dbConnection.execute(
        "UPDATE messages SET is_seen = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_seen = FALSE",
        [other_user_id, user_id]
      );
      const [result] = await req.dbConnection.execute(
        "SELECT id FROM messages WHERE sender_id = ? AND receiver_id = ? AND is_seen = TRUE",
        [other_user_id, user_id]
      );
      updatedMessageIds = result.map((row) => row.id);
    }
    res.json({
      success: true,
      message: "Đã đánh dấu tin nhắn là đã xem",
      updatedMessageIds,
    });
  } catch (error) {
    console.error("Lỗi khi đánh dấu tin nhắn đã xem:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi đánh dấu tin nhắn đã xem" });
  }
});

module.exports = router;
