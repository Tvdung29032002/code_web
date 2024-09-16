// Kiểm tra trạng thái đăng nhập khi tải trang
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") === "true") {
    checkUserRole(); // Đảm bảo gọi hàm này sau khi người dùng đã đăng nhập
  } else {
    window.location.href = "login.html";
  }
});

// Hàm đăng xuất
function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
  // Chuyển hướng về trang đăng nhập
  window.location.href = "login.html";
}

// Thêm logic xử lý đăng nhập
async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.success) {
      const currentUser = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("userId", currentUser.id);
      localStorage.setItem("isLoggedIn", "true");
      checkUserRole();
      window.location.href = "index.html";
    }
  } catch (error) {
    // Xử lý lỗi nếu cần
  }
}

// Cập nhật hàm kiểm tra vai trò người dùng
function checkUserRole() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser && currentUser.role) {
    if (currentUser.role === "Admin") {
      document.querySelectorAll(".admin-only").forEach((el) => {
        el.style.display = "block";
      });
    } else {
      document.querySelectorAll(".admin-only").forEach((el) => {
        el.style.display = "none";
      });
    }
  } else {
    // Xử lý trường hợp không có thông tin người dùng
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.style.display = "none";
    });
  }
}

// Gọi hàm kiểm tra vai trò khi trang được tải
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("isLoggedIn") === "true") {
    checkUserRole(); // Đảm bảo gọi hàm này sau khi người dùng đã đăng nhập
  } else {
    window.location.href = "login.html";
  }
});
