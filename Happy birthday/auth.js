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

// Sau khi nhận được phản hồi đăng nhập thành công từ server
localStorage.setItem(
  "userInfo",
  JSON.stringify({
    id: response.user.id,
    username: response.user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    hasUpdatedInfo: user.has_updated_info === 1,
  })
);
