const express = require("express");
const router = express.Router();

// Lấy danh sách người dùng
router.get("/users", async (req, res) => {
  try {
    const [rows] = await req.dbConnection.execute(`
      SELECT u.id, u.firstName, u.lastName, u.username, u.email, ura.role
      FROM users u
      LEFT JOIN user_roles_actions ura ON u.id = ura.user_id
    `);
    res.json(rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
});

// Thêm người dùng mới
router.post("/users", async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    birthDate,
    gender,
    role,
  } = req.body;
  try {
    const [result] = await req.dbConnection.execute(
      "INSERT INTO users (firstName, lastName, username, email, password, birthDate, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, password, birthDate, gender]
    );
    const userId = result.insertId;
    await req.dbConnection.execute(
      "INSERT INTO user_roles_actions (user_id, role, action) VALUES (?, ?, ?)",
      [userId, role, "create"]
    );
    res.status(201).json({ message: "Người dùng đã được tạo", userId });
  } catch (error) {
    console.error("Lỗi khi thêm người dùng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
});

// Cập nhật thông tin người dùng
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, username, email, role } = req.body;
  try {
    await req.dbConnection.execute(
      "UPDATE users SET firstName = ?, lastName = ?, username = ?, email = ? WHERE id = ?",
      [firstName, lastName, username, email, id]
    );
    await req.dbConnection.execute(
      "INSERT INTO user_roles_actions (user_id, role, action) VALUES (?, ?, ?)",
      [id, role, "update"]
    );
    res.json({ message: "Thông tin người dùng đã được cập nhật" });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
});

// Xóa người dùng
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await req.dbConnection.execute(
      "DELETE FROM user_roles_actions WHERE user_id = ?",
      [id]
    );
    await req.dbConnection.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Người dùng đã được xóa" });
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
});

// Cập nhật vai trò người dùng
router.put("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    // Kiểm tra xem người dùng đã có vai trò chưa
    const [existingRole] = await req.dbConnection.execute(
      "SELECT * FROM user_roles_actions WHERE user_id = ?",
      [id]
    );

    if (existingRole.length > 0) {
      // Cập nhật vai trò nếu đã tồn tại
      await req.dbConnection.execute(
        'UPDATE user_roles_actions SET role = ?, action = "update" WHERE user_id = ?',
        [role, id]
      );
    } else {
      // Thêm mới vai trò nếu chưa tồn tại
      await req.dbConnection.execute(
        'INSERT INTO user_roles_actions (user_id, role, action) VALUES (?, ?, "create")',
        [id, role]
      );
    }
    res.json({ message: "Vai trò người dùng đã được cập nhật" });
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò người dùng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
});

// Xóa vai trò người dùng
router.delete("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  try {
    // Xóa vai trò của người dùng
    await req.dbConnection.execute(
      "DELETE FROM user_roles_actions WHERE user_id = ?",
      [id]
    );
    res.json({ message: "Vai trò người dùng đã được xóa" });
  } catch (error) {
    console.error("Lỗi khi xóa vai trò người dùng:", error);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
});

module.exports = router;
