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
    console.log("Login response:", data);
    if (data.success) {
      const currentUser = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
      };
      console.log("Current user data:", currentUser);
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("userId", currentUser.id); // Đảm bảo lưu userId
      localStorage.setItem("isLoggedIn", "true");
      console.log("User role saved:", currentUser.role);
      console.log("UserId saved:", currentUser.id); // Thêm log này
      checkUserRole();
      window.location.href = "index.html";
    } else {
      console.error("Đăng nhập thất bại");
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
  }
}

// Cập nhật hàm kiểm tra vai trò người dùng
function checkUserRole() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  console.log("Current user data from localStorage:", currentUser);
  if (currentUser && currentUser.role) {
    console.log("Checking user role:", currentUser.role);
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
    console.log("User role not found or user not logged in");
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
