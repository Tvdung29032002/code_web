// signup.js

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const signupModal = document.getElementById("signupModal");
  const createAccountBtn = document.querySelector(".create-account");
  const closeSignupModal = signupModal.querySelector(".close");

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  if (createAccountBtn) {
    createAccountBtn.onclick = function () {
      signupModal.style.display = "block";
    };
  }

  if (closeSignupModal) {
    closeSignupModal.onclick = function () {
      signupModal.style.display = "none";
    };
  }

  initializeDateDropdowns();
  initializePasswordStrengthCheck();
  initializePasswordToggle(); // Thêm dòng này
});

function handleSignup(e) {
  e.preventDefault();

  const firstName = document.getElementById("firstName")?.value.trim() || "";
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
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Vui lòng nhập lại địa chỉ Email hợp lệ.");
    return;
  }

  if (!displayPasswordStrength(password, "password-strength-message")) {
    alert("Vui lòng nhập mật khẩu mạnh hơn.");
    return;
  }

  const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  const userData = {
    firstName,
    lastName,
    username,
    email,
    password,
    birthDate,
    gender,
  };

  fetch("http://192.168.0.103:3000/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Đăng ký thành công!");
        document.getElementById("signupModal").style.display = "none";
      } else {
        alert(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
}

function initializeDateDropdowns() {
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
}

function initializePasswordStrengthCheck() {
  const passwordInput = document.getElementById("signupPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      displayPasswordStrength(this.value, "password-strength-message");
    });
  }
}

function initializePasswordToggle() {
  const togglePasswordButtons = document.querySelectorAll(".toggle-password");
  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const passwordInput = document.getElementById(targetId);
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      this.src =
        type === "password"
          ? "/image_login/eye-closed.png"
          : "/image_login/eye-open.png";
    });
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
