const API_BASE_URL = "http://192.168.0.103:3000"; // Thay đổi cổng này nếu server của bạn chạy ở cổng khác

let users = [];

async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    users = await response.json();
    populateUserTable();
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
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
                </td>
            </tr>
        `;
    tableBody.innerHTML += row;
  });
}

async function updateUserRole(userId) {
  const role = document.getElementById("role").value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (response.ok) {
      // Cập nhật vai trò trong mảng users
      const userIndex = users.findIndex((user) => user.id === userId);
      if (userIndex !== -1) {
        users[userIndex].role = role;
      }
      // Cập nhật giao diện
      populateUserTable();
      closeModal();
    } else {
      console.error("Lỗi khi cập nhật vai trò người dùng");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò người dùng:", error);
  }
}

async function deleteUserRole(userId) {
  if (confirm("Bạn có chắc chắn muốn xóa vai trò của người dùng này?")) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Cập nhật vai trò trong mảng users
        const userIndex = users.findIndex((user) => user.id === userId);
        if (userIndex !== -1) {
          users[userIndex].role = null;
        }
        // Cập nhật giao diện
        populateUserTable();
      } else {
        console.error("Lỗi khi xóa vai trò người dùng");
      }
    } catch (error) {
      console.error("Lỗi khi xóa vai trò người dùng:", error);
    }
  }
}

function openModal(userId = null) {
  const modal = document.getElementById("userModal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("userForm");
  const userInfoDiv = document.getElementById("userInfo");
  const passwordField = document.getElementById("password");

  if (userId) {
    const user = users.find((u) => u.id === userId);
    modalTitle.textContent = user.role
      ? "Chỉnh sửa Vai trò Người Dùng"
      : "Thêm Vai trò Người Dùng";

    // Hiển thị thông tin người dùng
    userInfoDiv.innerHTML = `
      <p><strong>Tên người dùng:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;

    // Ẩn các trường không cần thiết khi chỉnh sửa vai trò
    document.getElementById("firstName").parentElement.style.display = "none";
    document.getElementById("lastName").parentElement.style.display = "none";
    document.getElementById("username").parentElement.style.display = "none";
    document.getElementById("email").parentElement.style.display = "none";
    passwordField.parentElement.style.display = "none";
    document.getElementById("birthDate").parentElement.style.display = "none";
    document.getElementById("gender").parentElement.style.display = "none";

    const roleSelect = document.getElementById("role");
    roleSelect.value = user.role || "";

    form.onsubmit = (e) => {
      e.preventDefault();
      updateUserRole(userId);
    };
  } else {
    modalTitle.textContent = "Thêm Người Dùng Mới";
    userInfoDiv.innerHTML = "";

    // Hiển thị tất cả các trường khi thêm người dùng mới
    document.getElementById("firstName").parentElement.style.display = "block";
    document.getElementById("lastName").parentElement.style.display = "block";
    document.getElementById("username").parentElement.style.display = "block";
    document.getElementById("email").parentElement.style.display = "block";
    passwordField.parentElement.style.display = "block";
    document.getElementById("birthDate").parentElement.style.display = "block";
    document.getElementById("gender").parentElement.style.display = "block";

    form.reset();

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
  const userInfo = document.querySelector("#userForm > div:not(.form-group)");
  if (userInfo) {
    userInfo.remove();
  }
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
      headers: { "Content-Type": "application/json" },
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
    if (response.ok) {
      await fetchUsers();
      closeModal();
    } else {
      console.error("Lỗi khi thêm người dùng");
    }
  } catch (error) {
    console.error("Lỗi khi thêm người dùng:", error);
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
  if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/users/${userId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        await fetchUsers();
      } else {
        console.error("Lỗi khi xóa người dùng");
      }
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchUsers();

  const addUserBtn = document.getElementById("addUserBtn");
  addUserBtn.addEventListener("click", () => openModal());

  const closeBtn = document.querySelector(".close");
  closeBtn.addEventListener("click", closeModal);

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
