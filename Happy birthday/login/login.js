// login.js

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("loginPassword");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      this.src =
        type === "password"
          ? "/image_login/eye-closed.png"
          : "/image_login/eye-open.png";
    });
  }

  // Load saved username if available
  window.addEventListener("load", function () {
    const savedUsername = localStorage.getItem("username");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (savedUsername && isLoggedIn === "true") {
      document.getElementById("loginUsername").value = savedUsername;
      document.getElementById("keepLoggedIn").checked = true;
    }
  });
});

function handleLogin(e) {
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
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Server response:", data);
      if (data.success) {
        handleSuccessfulLogin(data);
      } else {
        console.log("Login failed:", data.message);
        alert(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    })
    .catch((error) => {
      console.error("Error during login:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
}

function handleSuccessfulLogin(data) {
  console.log("Đăng nhập thành công");
  localStorage.setItem("username", data.user.username);
  localStorage.setItem("isLoggedIn", "true");
  console.log("Vai trò người dùng từ máy chủ:", data.user.role);
  const currentUser = {
    id: data.user.id,
    username: data.user.username,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    email: data.user.email,
    role: data.user.role,
    online_status: true,
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  console.log("Dữ liệu người dùng đã lưu vào localStorage:", currentUser);
  localStorage.setItem("userId", data.user.id);
  console.log("Vai trò người dùng đã lưu:", data.user.role);
  console.log("UserId đã lưu:", data.user.id);
  localStorage.setItem("token", data.token);

  if (data.user.hasUpdatedInfo !== undefined) {
    if (data.user.hasUpdatedInfo) {
      alert("Đăng nhập thành công!");
    } else {
      alert(
        "Đăng nhập thành công! Vui lòng cập nhật thông tin cá nhân của bạn."
      );
    }
  } else {
    alert("Đăng nhập thành công! Vui lòng cập nhật thông tin cá nhân của bạn.");
  }

  window.location.href = "http://192.168.0.103:5500/index.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("userId");
  localStorage.removeItem("isLoggedIn");
  window.location.href = "/login.html";
}
