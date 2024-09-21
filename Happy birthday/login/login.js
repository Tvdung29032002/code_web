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

  const recaptchaResponse = grecaptcha.getResponse();

  if (!recaptchaResponse) {
    alert("Vui lòng xác nhận bạn không phải là robot.");
    return;
  }

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
      if (data.success) {
        handleSuccessfulLogin(data);
      } else {
        alert(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    })
    .catch((error) => {
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
}

function handleSuccessfulLogin(data) {
  localStorage.setItem("username", data.user.username);
  localStorage.setItem("isLoggedIn", "true");
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
  localStorage.setItem("userId", data.user.id);
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
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser && currentUser.id) {
    ChatAPI.updateOnlineStatus(currentUser.id, false)
      .then(() => {
        console.log("Đã cập nhật trạng thái offline");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userId");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login.html";
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật trạng thái offline:", error);
        // Vẫn tiếp tục đăng xuất ngay cả khi có lỗi
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userId");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login.html";
      });
  } else {
    window.location.href = "/login.html";
  }
}
