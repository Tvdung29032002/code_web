// Kiểm tra trạng thái đăng nhập khi tải trang
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
  }
});

// Hàm đăng xuất
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
