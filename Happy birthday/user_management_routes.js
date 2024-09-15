const express = require("express");
const { checkAdminRole } = require("./authMiddleware");
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
    // Kiểm tra xem username hoặc email đã tồn tại chưa
    const [existingUser] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ error: "Tên người dùng hoặc email đã tồn tại" });
    }

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
    console.error("Lỗi chi tiết khi thêm người dùng:", error);
    res
      .status(500)
      .json({ error: "Lỗi server nội bộ", details: error.message });
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
    // Bắt đầu giao dịch
    await req.dbConnection.beginTransaction();

    // Xóa vai trò của người dùng từ bảng user_roles_actions
    await req.dbConnection.execute(
      "DELETE FROM user_roles_actions WHERE user_id = ?",
      [id]
    );

    // Xóa thông tin cá nhân của người dùng từ bảng personal_info (nếu có)
    await req.dbConnection.execute(
      "DELETE FROM personal_info WHERE user_id = ?",
      [id]
    );

    // Xóa người dùng từ bảng users
    await req.dbConnection.execute("DELETE FROM users WHERE id = ?", [id]);

    // Hoàn tất giao dịch
    await req.dbConnection.commit();

    res.json({ success: true, message: "Người dùng đã được xóa thành công" });
  } catch (error) {
    // Nếu có lỗi, hủy bỏ giao dịch
    await req.dbConnection.rollback();
    console.error("Lỗi khi xóa người dùng:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi xóa người dùng",
        error: error.message,
      });
  }
});

// Cập nhật vai trò người dùng
router.put("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  console.log(`Attempting to update role for user ${id} to ${role}`);
  try {
    // Kiểm tra xem người dùng đã có vai trò chưa
    const [existingRole] = await req.dbConnection.execute(
      "SELECT * FROM user_roles_actions WHERE user_id = ?",
      [id]
    );
    console.log("Existing role:", existingRole);

    if (existingRole.length > 0) {
      console.log("Updating existing role");
      // Cập nhật vai trò nếu đã tồn tại
      await req.dbConnection.execute(
        'UPDATE user_roles_actions SET role = ?, action = "update" WHERE user_id = ?',
        [role, id]
      );
    } else {
      console.log("Inserting new role");
      // Thêm mới vai trò nếu chưa tồn tại
      await req.dbConnection.execute(
        'INSERT INTO user_roles_actions (user_id, role, action) VALUES (?, ?, "create")',
        [id, role]
      );
    }
    console.log("Role update successful");
    res.json({ success: true, message: "Vai trò người dùng đã được cập nhật" });
  } catch (error) {
    console.error("Lỗi chi tiết khi cập nhật vai trò người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
      error: error.message,
      stack: error.stack,
    });
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
