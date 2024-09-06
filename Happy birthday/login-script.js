document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const keepLoggedIn = document.getElementById("keepLoggedIn").checked;

  console.log("Username being sent:", username);
  console.log("Attempting login for username:", username);
  console.log("Keep logged in:", keepLoggedIn);

  const recaptchaResponse = grecaptcha.getResponse();

  if (!recaptchaResponse) {
    console.log("reCAPTCHA not completed");
    alert("Vui lòng xác nhận bạn không phải là robot.");
    return;
  }

  console.log("Sending login request to server...");

  fetch("http://192.168.0.103:3000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => {
      console.log("Received response from server");
      return response.json();
    })
    .then((data) => {
      console.log("Server response:", data);
      if (data.success) {
        console.log("Login successful");
        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("userId", data.user.id); // Thêm dòng này
        if (keepLoggedIn) {
          console.log("Saving login info to localStorage");
          localStorage.setItem("isLoggedIn", "true");
        } else {
          console.log("Removing isLoggedIn from localStorage");
          localStorage.removeItem("isLoggedIn");
        }

        // Kiểm tra xem người dùng đã cập nhật thông tin cá nhân chưa
        if (data.user && data.user.hasUpdatedInfo !== undefined) {
          if (data.user.hasUpdatedInfo) {
            alert("Đăng nhập thành công!");
          } else {
            alert(
              "Đăng nhập thành công! Vui lòng cập nhật thông tin cá nhân của bạn."
            );
          }
        } else {
          alert(
            "Đăng nhập thành công! Vui lòng cập nhật thông tin cá nhân của bạn."
          );
        }

        window.location.href = "index.html";
      } else {
        console.log("Login failed:", data.message);
        alert(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    })
    .catch((error) => {
      console.error("Error during login:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
});

document.addEventListener("DOMContentLoaded", function () {
  const togglePassword = document.getElementById("togglePassword");
  const password = document.getElementById("loginPassword");

  if (togglePassword && password) {
    togglePassword.addEventListener("click", function () {
      const type =
        password.getAttribute("type") === "password" ? "text" : "password";
      password.setAttribute("type", type);
      this.src =
        type === "password"
          ? "image_login/eye-closed.png"
          : "image_login/eye-open.png";
    });
  }

  // New code for change password modal
  const changePasswordModal = document.getElementById("changePasswordModal");
  if (changePasswordModal) {
    const toggleButtons =
      changePasswordModal.querySelectorAll(".toggle-password");
    toggleButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        const passwordInput = document.getElementById(targetId);

        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          this.src = "image_login/eye-open.png";
        } else {
          passwordInput.type = "password";
          this.src = "image_login/eye-closed.png";
        }
      });
    });
  }
});

window.addEventListener("load", function () {
  const savedUsername = localStorage.getItem("username");
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (savedUsername && isLoggedIn === "true") {
    document.getElementById("loginUsername").value = savedUsername;
    document.getElementById("keepLoggedIn").checked = true;
  }
});

var modal = document.getElementById("signupModal");
var btn = document.querySelector(".create-account");
var span = document.getElementsByClassName("close")[0];

if (btn) {
  btn.onclick = function () {
    modal.style.display = "block";
  };
}

if (span) {
  span.onclick = function () {
    modal.style.display = "none";
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const daySelect = document.getElementById("day");
  const monthSelect = document.getElementById("month");
  const yearSelect = document.getElementById("year");

  if (daySelect) {
    for (let i = 1; i <= 31; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      daySelect.appendChild(option);
    }
  }

  if (monthSelect) {
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];
    months.forEach((month, index) => {
      const option = document.createElement("option");
      option.value = index + 1;
      option.textContent = month;
      monthSelect.appendChild(option);
    });
  }

  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 100; i--) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      yearSelect.appendChild(option);
    }
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@gmail\.com$/i;
  return emailRegex.test(email);
}

function checkPasswordStrength(password) {
  // Kiểm tra độ dài
  if (password.length < 8) {
    return {
      strength: "weak",
      message: "Mật khẩu quá yếu. Cần ít nhất 8 ký tự.",
    };
  }

  // Kiểm tra có chữ hoa, chữ thường, số và ký tự đặc biệt
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
    switch (strengthResult.strength) {
      case "weak":
        messageElement.style.color = "red";
        break;
      case "medium":
        messageElement.style.color = "orange";
        break;
      case "strong":
        messageElement.style.color = "green";
        break;
    }
  }

  return strengthResult.strength === "strong";
}

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const firstName =
        document.getElementById("firstName")?.value.trim() || "";
      const lastName = document.getElementById("lastName")?.value.trim() || "";
      const username =
        document.getElementById("signupUsername")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || "";
      const password = document.getElementById("signupPassword")?.value || "";
      const day = document.getElementById("day")?.value || "";
      const month = document.getElementById("month")?.value || "";
      const year = document.getElementById("year")?.value || "";
      const gender =
        document.querySelector('input[name="gender"]:checked')?.value || "";

      console.log("Form data:", {
        firstName,
        lastName,
        username,
        email,
        password,
        day,
        month,
        year,
        gender,
      });

      if (
        !firstName ||
        !lastName ||
        !username ||
        !email ||
        !password ||
        !day ||
        !month ||
        !year ||
        !gender
      ) {
        console.log("Missing information detected");
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Vui lòng nhập lại địa chỉ Email hợp lệ.");
        return;
      }

      // Kiểm tra độ mạnh của mật khẩu
      if (!displayPasswordStrength(password, "password-strength-message")) {
        alert("Vui lòng nhập mật khẩu mạnh hơn.");
        return;
      }

      const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      const userData = {
        firstName,
        lastName,
        username,
        email,
        password,
        birthDate,
        gender,
      };

      console.log("Sending registration data:", userData);

      fetch("http://192.168.0.103:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Server response:", data);
          if (data.success) {
            alert("Đăng ký thành công!");
            modal.style.display = "none";
          } else {
            alert(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
        });
    });
  } else {
    console.error("Signup form not found!");
  }

  // Xử lý mở modal quên mật khẩu
  const forgotPasswordLink = document.querySelector(".forgot-password");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const closeForgotPasswordModal = forgotPasswordModal.querySelector(".close");

  forgotPasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    forgotPasswordModal.style.display = "block";
  });

  closeForgotPasswordModal.addEventListener("click", function () {
    forgotPasswordModal.style.display = "none";
  });

  // Thêm biến để lưu email của người dùng đang thay đổi mật khẩu
  let currentResetEmail = "";

  // Xử lý form quên mật khẩu
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const changePasswordModal = document.getElementById("changePasswordModal");

  forgotPasswordForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("forgotPasswordEmail").value.trim();

    if (!isValidEmail(email)) {
      alert("Vui lòng nhập một địa chỉ email hợp lệ.");
      return;
    }

    fetch("http://192.168.0.103:3000/api/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(
            "Thông tin tài khoản và mật khẩu tạm thời đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến và thay đổi mật khẩu ngay."
          );
          currentResetEmail = email;
          // Đóng modal quên mật khẩu và hiển thị modal thay đổi mật khẩu
          forgotPasswordModal.style.display = "none";
          changePasswordModal.style.display = "block";
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
  });

  // Xử lý form thay đổi mật khẩu
  const changePasswordForm = document.getElementById("changePasswordForm");
  changePasswordForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const tempPassword = document.getElementById("tempPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword =
      document.getElementById("confirmNewPassword").value;

    if (newPassword !== confirmNewPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    // Kiểm tra độ mạnh của mật khẩu mới
    if (
      !displayPasswordStrength(newPassword, "new-password-strength-message")
    ) {
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
          alert(
            "Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại."
          );
          changePasswordModal.style.display = "none";
          currentResetEmail = "";
          // Chuyển hướng về trang đăng nhập
          window.location.href = "login.html";
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
  });

  // Xử lý đóng modal thay đổi mật khẩu
  const closeChangePasswordModal = changePasswordModal.querySelector(".close");
  closeChangePasswordModal.addEventListener("click", function () {
    changePasswordModal.style.display = "none";
  });

  // Thêm sự kiện lắng nghe cho trường mật khẩu trong form đăng ký
  const passwordInput = document.getElementById("signupPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      displayPasswordStrength(this.value, "password-strength-message");
    });
  }

  // Thêm sự kiện lắng nghe cho các trường mật khẩu trong modal thay đổi mật khẩu
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
});

// Đảm bảo rằng tất cả các modal được đóng khi click bên ngoài
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
  if (event.target == document.getElementById("forgotPasswordModal")) {
    document.getElementById("forgotPasswordModal").style.display = "none";
  }
  if (event.target == document.getElementById("changePasswordModal")) {
    document.getElementById("changePasswordModal").style.display = "none";
  }
};

// Thêm sự kiện lắng nghe cho các trường mật khẩu trong modal thay đổi mật khẩu
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

function logout() {
  localStorage.removeItem("currentUser");
  // Chuyển hướng đến trang đăng nhập hoặc trang chính
  window.location.href = "/login";
}
