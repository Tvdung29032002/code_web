const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const router = express.Router();

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
    const { email, tempPassword, newPassword } = req.body;

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

module.exports = router;
