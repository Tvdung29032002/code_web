// password-management.js

let currentResetEmail = "";

document.addEventListener("DOMContentLoaded", function () {
  initializeForgotPasswordModal();
  initializeChangePasswordModal();
});

function initializeForgotPasswordModal() {
  const forgotPasswordLink = document.querySelector(".forgot-password");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const closeForgotPasswordModal = forgotPasswordModal.querySelector(".close");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  forgotPasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    forgotPasswordModal.style.display = "block";
  });

  closeForgotPasswordModal.addEventListener("click", function () {
    forgotPasswordModal.style.display = "none";
  });

  forgotPasswordForm.addEventListener("submit", handleForgotPassword);
}

function initializeChangePasswordModal() {
  const changePasswordModal = document.getElementById("changePasswordModal");
  const closeChangePasswordModal = changePasswordModal.querySelector(".close");
  const changePasswordForm = document.getElementById("changePasswordForm");

  closeChangePasswordModal.addEventListener("click", function () {
    changePasswordModal.style.display = "none";
  });

  changePasswordForm.addEventListener("submit", handleChangePassword);

  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");

  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", function () {
      displayPasswordStrength(this.value, "new-password-strength-message");
    });
  }

  if (confirmNewPasswordInput) {
    confirmNewPasswordInput.addEventListener("input", function () {
      if (this.value !== newPasswordInput.value) {
        this.setCustomValidity("Mật khẩu không khớp");
      } else {
        this.setCustomValidity("");
      }
    });
  }
}

function handleForgotPassword(e) {
  e.preventDefault();
  const username = document
    .getElementById("forgotPasswordUsername")
    .value.trim();
  const email = document.getElementById("forgotPasswordEmail").value.trim();

  if (!username || !email) {
    alert("Vui lòng nhập đầy đủ tên đăng nhập và email.");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Vui lòng nhập một địa chỉ email hợp lệ.");
    return;
  }

  fetch("http://192.168.0.103:3000/api/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert(
          "Thông tin tài khoản và mật khẩu tạm thời đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến và thay đổi mật khẩu ngay."
        );
        currentResetEmail = email;
        document.getElementById("forgotPasswordModal").style.display = "none";
        document.getElementById("changePasswordModal").style.display = "block";
      } else {
        alert(
          data.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại sau."
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
}

function handleChangePassword(e) {
  e.preventDefault();
  const tempPassword = document.getElementById("tempPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword =
    document.getElementById("confirmNewPassword").value;

  if (!tempPassword || !newPassword || !confirmNewPassword) {
    alert("Vui lòng điền đầy đủ thông tin.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("Mật khẩu mới và xác nhận mật khẩu không khớp.");
    return;
  }

  if (!displayPasswordStrength(newPassword, "new-password-strength-message")) {
    alert("Vui lòng nhập mật khẩu mạnh hơn.");
    return;
  }

  fetch("http://192.168.0.103:3000/api/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: currentResetEmail,
      tempPassword: tempPassword,
      newPassword: newPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại.");
        document.getElementById("changePasswordModal").style.display = "none";
        currentResetEmail = "";
        window.location.href = "/login.html";
      } else {
        alert(
          data.message || "Không thể thay đổi mật khẩu. Vui lòng thử lại sau."
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@gmail\.com$/i;
  return emailRegex.test(email);
}

function checkPasswordStrength(password) {
  if (password.length < 8) {
    return {
      strength: "weak",
      message: "Mật khẩu quá yếu. Cần ít nhất 8 ký tự.",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
    return { strength: "strong", message: "Mật khẩu mạnh" };
  } else {
    return {
      strength: "medium",
      message: "Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.",
    };
  }
}

function displayPasswordStrength(password, messageElementId) {
  const strengthResult = checkPasswordStrength(password);
  const messageElement = document.getElementById(messageElementId);

  if (messageElement) {
    messageElement.textContent = strengthResult.message;
    messageElement.style.color =
      strengthResult.strength === "weak"
        ? "red"
        : strengthResult.strength === "medium"
        ? "orange"
        : "green";
  }

  return strengthResult.strength === "strong";
}

// Close modals when clicking outside
window.onclick = function (event) {
  if (event.target == document.getElementById("forgotPasswordModal")) {
    document.getElementById("forgotPasswordModal").style.display = "none";
  }
  if (event.target == document.getElementById("changePasswordModal")) {
    document.getElementById("changePasswordModal").style.display = "none";
  }
};
