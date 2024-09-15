const API_BASE_URL = "http://192.168.0.103:3000"; // Thay đổi cổng này nếu server của bạn chạy ở cổng khác

let users = [];

async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Thêm token xác thực
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    users = data;
    populateUserTable();

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    console.log("Current User:", currentUser);
    if (currentUser && currentUser.role === "Admin") {
      document
        .querySelectorAll(".admin-only")
        .forEach((el) => (el.style.display = "block"));
    } else {
      document
        .querySelectorAll(".admin-only")
        .forEach((el) => (el.style.display = "none"));
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    alert("Không thể lấy danh sách người dùng. Vui lòng thử lại sau.");
  }
}

function populateUserTable() {
  const tableBody = document.getElementById("userTableBody");
  tableBody.innerHTML = "";
  users.forEach((user) => {
    const row = `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role || "Chưa có vai trò"}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="openModal(${user.id})">${
      user.role ? "Sửa vai trò" : "Thêm vai trò"
    }</button>
                    ${
                      user.role
                        ? `<button class="delete-btn" onclick="deleteUserRole(${user.id})">Xóa vai trò</button>`
                        : ""
                    }
                    <button class="delete-btn" onclick="deleteUser(${
                      user.id
                    })">Xóa tài khoản</button>
                </td>
            </tr>
        `;
    tableBody.innerHTML += row;
  });
}

async function updateUserRole(userId) {
  const role = document.getElementById("role").value;
  console.log(`Đang cập nhật vai trò cho người dùng ${userId} thành ${role}`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ role }),
    });
    console.log("Trạng thái phản hồi:", response.status);
    const data = await response.json();
    console.log("Dữ liệu phản hồi:", data);

    if (response.ok) {
      // Cập nhật vai trò trong mảng users
      const userIndex = users.findIndex((user) => user.id === userId);
      if (userIndex !== -1) {
        users[userIndex].role = role;
      }
      // Cập nhật giao diện
      populateUserTable();
      closeModal();
      alert(data.message || "Cập nhật vai trò thành công!");

      // Tự động làm mới trang sau 1 giây
      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      console.error("Lỗi khi cập nhật vai trò người dùng:", data);
      alert(
        data.message || "Lỗi khi cập nhật vai trò người dùng. Vui lòng thử lại."
      );
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò người dùng:", error);
    alert("Lỗi khi cập nhật vai trò người dùng. Vui lòng thử lại.");
  }
}

async function deleteUserRole(userId) {
  if (confirm("Bạn có chắc chắn muốn xóa vai trò của người dùng này?")) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Thêm token xác thực
        },
      });
      if (response.ok) {
        // Cập nhật vai trò trong mảng users
        const userIndex = users.findIndex((user) => user.id === userId);
        if (userIndex !== -1) {
          users[userIndex].role = null;
        }
        // Cập nhật giao diện
        populateUserTable();
        alert("Xóa vai trò thành công!");
      } else {
        console.error("Lỗi khi xóa vai trò người dùng");
        alert("Lỗi khi xóa vai trò người dùng. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa vai trò người dùng:", error);
      alert("Lỗi khi xóa vai trò người dùng. Vui lòng thử lại.");
    }
  }
}

function openModal(userId = null) {
  const modal = document.getElementById("userModal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("userForm");

  // Đặt lại form về trạng thái ban đầu
  form.reset();

  // Hiển thị tất cả các trường và đặt lại thuộc tính required
  document.querySelectorAll("#userForm .form-group").forEach((el) => {
    el.style.display = "block";
    const input = el.querySelector("input, select");
    if (input) input.setAttribute("required", "");
  });

  if (userId) {
    // Xử lý cho trường hợp chỉnh sửa người dùng
    const user = users.find((u) => u.id === userId);
    modalTitle.textContent = user.role
      ? "Sửa Vai trò Người Dùng"
      : "Thêm Vai trò Người Dùng";

    // Hiển thị thông tin người dùng
    const userInfoDiv =
      document.getElementById("userInfo") || document.createElement("div");
    userInfoDiv.id = "userInfo";
    userInfoDiv.innerHTML = `
      <p><strong>Tên người dùng:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
    form.insertBefore(userInfoDiv, form.firstChild);

    // Ẩn các trường không cần thiết khi chỉnh sửa vai trò
    [
      "firstName",
      "lastName",
      "username",
      "email",
      "password",
      "birthDate",
      "gender",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.parentElement.style.display = "none";
        el.removeAttribute("required");
      }
    });

    const roleSelect = document.getElementById("role");
    if (roleSelect) roleSelect.value = user.role || "";

    form.onsubmit = (e) => {
      e.preventDefault();
      updateUserRole(userId);
    };
  } else {
    // Xử lý cho trường hợp thêm người dùng mới
    modalTitle.textContent = "Thêm Người Dùng Mới";
    const userInfoDiv = document.getElementById("userInfo");
    if (userInfoDiv) userInfoDiv.remove();

    form.onsubmit = (e) => {
      e.preventDefault();
      addUser();
    };
  }

  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("userModal");
  modal.style.display = "none";

  // Xóa thông tin người dùng khi đóng modal
  const userInfo = document.getElementById("userInfo");
  if (userInfo) {
    userInfo.remove();
  }

  // Reset form và hiển thị lại tất cả các trường
  const form = document.getElementById("userForm");
  form.reset();
  document.querySelectorAll("#userForm .form-group").forEach((el) => {
    el.style.display = "block";
    const input = el.querySelector("input, select");
    if (input) input.setAttribute("required", "");
  });
}

async function addUser() {
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const birthDate = document.getElementById("birthDate").value;
  const gender = document.getElementById("gender").value;
  const role = document.getElementById("role").value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        email,
        password,
        birthDate,
        gender,
        role,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      await fetchUsers();
      closeModal();
      alert("Người dùng mới đã được thêm thành công!");

      // Tự động làm mới trang sau 1 giây
      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      console.error("Lỗi khi thêm người dùng:", data);
      alert(data.error || "Lỗi khi thêm người dùng. Vui lòng thử lại.");
    }
  } catch (error) {
    console.error("Lỗi khi thêm người dùng:", error);
    alert("Lỗi khi thêm người dùng. Vui lòng thử lại.");
  }
}

async function updateUser(userId) {
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const birthDate = document.getElementById("birthDate").value;
  const gender = document.getElementById("gender").value;
  const role = document.getElementById("role").value;

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/users/${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          birthDate,
          gender,
          role,
        }),
      }
    );
    if (response.ok) {
      await fetchUsers();
      closeModal();
    } else {
      console.error("Lỗi khi cập nhật thông tin người dùng");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
  }
}

async function deleteUser(userId) {
  if (
    confirm(
      "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
    )
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        alert("Người dùng đã được xóa thành công!");
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || "Lỗi khi xóa người dùng. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
      alert("Lỗi khi xóa người dùng. Vui lòng thử lại.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchUsers();

  const addUserBtn = document.getElementById("addUserBtn");
  addUserBtn.addEventListener("click", () => openModal());

  const cancelButton = document.getElementById("cancelButton");
  if (cancelButton) {
    cancelButton.addEventListener("click", closeModal);
  } else {
    console.error("Không tìm thấy nút 'Hủy'");
  }

  const backButton = document.getElementById("back-button");
  backButton.addEventListener("click", () => {
    window.location.href = "/"; // Điều hướng về trang chủ
  });

  window.addEventListener("click", (event) => {
    const modal = document.getElementById("userModal");
    if (event.target === modal) {
      closeModal();
    }
  });
});

// Hàm lấy ID của người dùng đang đăng nhập (cần được triển khai)
function getCurrentUserId() {
  return localStorage.getItem("currentUserId");
}
