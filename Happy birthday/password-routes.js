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
    const { email } = req.body;
    console.log("Received email for password reset:", email);

    const [users] = await req.dbConnection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    console.log("Users found:", users.length);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống.",
      });
    }

    const user = users[0];

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("New password generated");

    await req.dbConnection.execute(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );
    console.log("Password updated in database");

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vboyht35@gmail.com",
        pass: "rwzb tatw piem seuj",
      },
    });

    let mailOptions = {
      from: "vboyht35@gmail.com",
      to: email,
      subject: "Thông tin tài khoản của bạn",
      html: `
        <h2>Thông tin tài khoản của bạn</h2>
        <p><strong>Họ và tên:</strong> ${user.firstName} ${user.lastName}</p>
        <p><strong>Tên đăng nhập:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Ngày sinh:</strong> ${new Date(
          user.birthDate
        ).toLocaleDateString()}</p>
        <p><strong>Giới tính:</strong> ${user.gender}</p>
        <p><strong>Mật khẩu tạm thời của bạn là:</strong> ${newPassword}</p>
        <p>Vui lòng đăng nhập và thay đổi mật khẩu của bạn ngay sau khi nhận được email này.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

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
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ thông tin: username, currentPassword và newPassword.",
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
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với username này.",
      });
    }

    const user = users[0];

    const isValidCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidCurrentPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng.",
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
        message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await req.dbConnection.execute(
      "UPDATE users SET password = ?, password_updated_at = CURRENT_TIMESTAMP WHERE username = ?",
      [hashedNewPassword, username]
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

module.exports = router;
