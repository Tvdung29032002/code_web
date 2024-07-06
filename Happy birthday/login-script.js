document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Đây chỉ là một ví dụ đơn giản. Trong thực tế, bạn nên sử dụng backend để xác thực.
  if (username === "xxx" && password === "123456") {
    // Lưu trạng thái đăng nhập vào localStorage
    localStorage.setItem("isLoggedIn", "true");
    // Chuyển hướng đến trang chính
    window.location.href = "index.html";
  } else {
    alert("Invalid username or password");
  }
});
