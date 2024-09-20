const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  console.log("Received login request");
  try {
    const { username, password } = req.body;
    console.log("Login attempt for username:", username);

    const query = `
      SELECT u.*, pi.id AS personal_info_id, 
      CASE WHEN pi.phone IS NOT NULL OR pi.bio IS NOT NULL THEN true ELSE false END AS has_updated_info,
      ura.role, u.failed_login_attempts, u.account_locked_until
      FROM users u 
      LEFT JOIN personal_info pi ON u.id = pi.user_id 
      LEFT JOIN user_roles_actions ura ON u.id = ura.user_id
      WHERE LOWER(u.username) = LOWER(?)
    `;
    console.log("SQL query:", query, "with username:", username);

    console.log("Executing database query...");
    const [users] = await req.dbConnection.execute(query, [username]);
    console.log("Query executed. Users found:", users.length);

    if (users.length === 0) {
      console.log("User not found in database");
      return res.json({
        success: false,
        message: "Tên đăng nhập không tồn tại",
      });
    }

    const user = users[0];
    console.log("User found:", user.username);

    // Check if the account is locked
    if (
      user.account_locked_until &&
      new Date() < new Date(user.account_locked_until)
    ) {
      return res.json({
        success: false,
        message: `Tài khoản của bạn đã bị khóa. Vui lòng thử lại sau ${new Date(
          user.account_locked_until
        ).toLocaleString()}.`,
      });
    }

    console.log("Comparing passwords...");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (isPasswordValid) {
      // Reset failed login attempts on successful login
      await req.dbConnection.execute(
        "UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, online_status = true WHERE id = ?",
        [user.id]
      );

      console.log(
        "Đăng nhập thành công và người dùng được đặt trạng thái trực tuyến"
      );
      res.json({
        success: true,
        message: "Đăng nhập thành công",
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          hasUpdatedInfo: user.has_updated_info === 1,
          online_status: true,
        },
      });
    } else {
      // Increase failed login attempts
      const newFailedAttempts = user.failed_login_attempts + 1;
      let updateQuery =
        "UPDATE users SET failed_login_attempts = ? WHERE id = ?";
      let updateParams = [newFailedAttempts, user.id];

      // If 5 failed attempts, lock the account
      if (newFailedAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60000); // Lock for 30 minutes
        updateQuery =
          "UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?";
        updateParams = [newFailedAttempts, lockUntil, user.id];
      }

      await req.dbConnection.execute(updateQuery, updateParams);

      // Return appropriate message
      if (newFailedAttempts >= 5) {
        return res.json({
          success: false,
          message:
            "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng sử dụng chức năng quên mật khẩu để đặt lại mật khẩu.",
        });
      } else if (newFailedAttempts >= 3) {
        return res.json({
          success: false,
          message: `Mật khẩu không đúng. Cảnh báo: Bạn đã nhập sai ${newFailedAttempts} lần. Tài khoản sẽ bị khóa sau 5 lần nhập sai.`,
        });
      } else {
        return res.json({ success: false, message: "Mật khẩu không đúng" });
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập thất bại",
      error: error.message,
    });
  }
});

// Login info route
router.get("/login", (req, res) => {
  res.json({
    message:
      "Đây là API đăng nhập. Vui lòng sử dụng phương thức POST để đăng nhập.",
  });
});

module.exports = router;
