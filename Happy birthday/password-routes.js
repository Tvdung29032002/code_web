const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const router = express.Router();

// Hàm kiểm tra độ mạnh của mật khẩu
function checkPasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  if (password.length < minLength) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasNonalphas) {
    return "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt.";
  }
  return null; // Mật khẩu đủ mạnh
}

// Reset password route
router.post("/reset-password", async (req, res) => {
  try {
    const { username, email } = req.body;
    console.log("Received request for password reset:", { username, email });

    const [users] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE username = ? AND email = ?",
      [username, email]
    );
    console.log("Users found:", users.length);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với tên đăng nhập và email này.",
      });
    }

    const user = users[0]; // Định nghĩa biến user

    console.log("Generating new password");
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("New password generated and hashed");

    console.log("Updating user in database");
    await req.dbConnection.execute(
      "UPDATE users SET password = ?, failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );
    console.log("User updated in database");

    console.log("Preparing to send email");
    // Gửi email với mật khẩu mới
    let mailOptions = {
      from: '"Admin" <your-email@gmail.com>',
      to: user.email,
      subject: "Đặt lại mật khẩu",
      text: `Mật khẩu mới của bạn là: ${newPassword}. Vui lòng đăng nhập và thay đổi mật khẩu ngay lập tức.`,
    };

    await transporter.sendMail(mailOptions);

    console.log("Password reset email sent");
    res.json({
      success: true,
      message:
        "Thông tin tài khoản và mật khẩu tạm thời đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể đặt lại mật khẩu",
      error: error.message,
    });
  }
});

// Change password route
router.post("/change-password", async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin.",
      });
    }

    // Kiểm tra độ mạnh của mật khẩu mới
    const passwordStrengthError = checkPasswordStrength(newPassword);
    if (passwordStrengthError) {
      return res.status(400).json({
        success: false,
        message: passwordStrengthError,
      });
    }

    const [users] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với email này.",
      });
    }

    const user = users[0];

    const isValidTempPassword = await bcrypt.compare(
      tempPassword,
      user.password
    );

    if (!isValidTempPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu tạm thời không đúng.",
      });
    }

    // Kiểm tra xem mật khẩu mới có giống mật khẩu cũ không
    const isSameAsOldPassword = await bcrypt.compare(
      newPassword,
      user.password
    );
    if (isSameAsOldPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải khác mật khẩu tạm thời.",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await req.dbConnection.execute(
      "UPDATE users SET password = ?, password_updated_at = CURRENT_TIMESTAMP WHERE email = ?",
      [hashedNewPassword, email]
    );

    res.json({
      success: true,
      message: "Mật khẩu đã được thay đổi thành công.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thay đổi mật khẩu",
      error: error.message,
    });
  }
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vboyht35@gmail.com",
    pass: "rwzb tatw piem seuj",
  },
});

module.exports = router;
