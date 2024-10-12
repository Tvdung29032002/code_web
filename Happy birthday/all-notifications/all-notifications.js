document.addEventListener("DOMContentLoaded", function () {
  fetchAllNotifications();
  setupEventListeners();

  // Thêm event listener cho sự kiện taskUpdated
  window.addEventListener("taskUpdated", function () {
    fetchAllNotifications();
  });
});
const backToHomeButton = document.getElementById("backToHome");
backToHomeButton.addEventListener("click", function () {
  window.location.href = "../index.html";
});
let allNotifications = [];
let currentPage = 1;
const itemsPerPage = 10;
let originalNotifications = [];

function setupEventListeners() {
  document
    .getElementById("searchInput")
    .addEventListener("input", filterNotifications);
  document
    .getElementById("filterSelect")
    .addEventListener("change", filterNotifications);
  document.getElementById("exportBtn").addEventListener("click", exportToCSV);
  document
    .getElementById("prevPage")
    .addEventListener("click", () => changePage(-1));
  document
    .getElementById("nextPage")
    .addEventListener("click", () => changePage(1));

  // Thêm sự kiện click cho các phần tử trong statistics
  document.querySelectorAll(".statistics span").forEach((span) => {
    span.addEventListener("click", handleStatisticsClick);
  });
}

async function fetchAllNotifications() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.error("Không tìm thấy userId");
    displayError("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
    return;
  }

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/all-notifications/${userId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      originalNotifications = data.notifications;
      allNotifications = [...originalNotifications];
      updateStatistics();
      displayNotifications();
    } else {
      throw new Error(data.message || "Lỗi không xác định khi lấy thông báo");
    }
  } catch (error) {
    console.error("Lỗi khi lấy tất cả thông báo:", error);
    displayError("Có lỗi xảy ra khi tải thông báo. Vui lòng thử lại sau.");
  }
}

function displayNotifications() {
  const notificationList = document.getElementById("allNotifications");
  notificationList.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = allNotifications.slice(startIndex, endIndex);

  if (paginatedNotifications.length === 0) {
    notificationList.innerHTML =
      "<li class='no-notifications'>Không có thông báo nào</li>";
    return;
  }

  paginatedNotifications.forEach((notification) => {
    const li = document.createElement("li");
    li.className = "notification-item";

    // Xử lý và định dạng nội dung thông báo
    const formattedMessage = formatNotificationMessage(notification.message);

    li.innerHTML = `
      <div class="notification-icon">${
        notification.completed ? "✅" : "📅"
      }</div>
      <div class="notification-content">
        <div class="notification-message">${formattedMessage}</div>
        <div class="notification-date">Hạn: ${notification.end_date}</div>
        <div class="notification-status ${
          notification.completed ? "completed" : "pending"
        }">
          ${notification.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
        </div>
      </div>
      ${
        !notification.is_read
          ? `<button class="mark-read-btn" data-id="${notification.id}">Đánh dấu đã đọc</button>`
          : ""
      }
      <button class="delete-btn" data-id="${notification.id}">Xóa</button>
    `;
    notificationList.appendChild(li);
  });

  updatePagination();
  addEventListenersToButtons();
}

function formatNotificationMessage(message) {
  // Tách tiêu đề và nội dung
  const [title, ...contentParts] = message.split(":");
  let content = contentParts.join(":").trim();

  // Tách các phần của nội dung
  const contentItems = content
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item);

  // Tạo HTML cho thông báo đã định dạng
  let formattedMessage = `<div class="notification-title">${escapeHtml(
    title.trim()
  )}</div>`;
  formattedMessage += '<ul class="notification-details">';
  contentItems.forEach((item) => {
    formattedMessage += `<li>${escapeHtml(item)}</li>`;
  });
  formattedMessage += "</ul>";

  return formattedMessage;
}

function addEventListenersToButtons() {
  const markReadButtons = document.querySelectorAll(".mark-read-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");

  markReadButtons.forEach((button) => {
    button.addEventListener("click", handleMarkRead);
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", handleDelete);
  });
}

async function handleMarkRead(event) {
  const notificationId = event.target.dataset.id;

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/notifications/${notificationId}/toggle-read`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: true }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      // Cập nhật trạng thái trong mảng allNotifications
      const notification = allNotifications.find(
        (n) => n.id === parseInt(notificationId)
      );
      if (notification) {
        notification.is_read = true;
      }

      // Cập nhật giao diện
      updateStatistics();
      displayNotifications();
    } else {
      throw new Error(
        data.message || "Lỗi không xác định khi cập nhật trạng thái đọc"
      );
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đọc:", error);
    displayError(
      "Có lỗi xảy ra khi cập nhật trạng thái đọc. Vui lòng thử lại sau."
    );
  }
}

async function handleDelete(event) {
  const notificationId = event.target.dataset.id;

  if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
    return;
  }

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/notifications/${notificationId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      // Xóa thông báo khỏi mảng allNotifications
      allNotifications = allNotifications.filter(
        (n) => n.id !== parseInt(notificationId)
      );
      displayNotifications();
      updateStatistics();
    } else {
      throw new Error(data.message || "Lỗi không xác định khi xóa thông báo");
    }
  } catch (error) {
    console.error("Lỗi khi xóa thông báo:", error);
    displayError("Có lỗi xảy ra khi xóa thông báo. Vui lòng thử lại sau.");
  }
}

function updatePagination() {
  const totalPages = Math.ceil(allNotifications.length / itemsPerPage);
  document.getElementById(
    "currentPage"
  ).textContent = `Trang ${currentPage} / ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

function changePage(direction) {
  currentPage += direction;
  displayNotifications();
}

function filterNotifications() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filterValue = document.getElementById("filterSelect").value;

  allNotifications = originalNotifications.filter((notification) => {
    const matchesSearch =
      notification.task_name.toLowerCase().includes(searchTerm) ||
      notification.message.toLowerCase().includes(searchTerm);

    let matchesFilter;
    switch (filterValue) {
      case "all":
        matchesFilter = true;
        break;
      case "completed":
        matchesFilter = notification.completed;
        break;
      case "pending":
        matchesFilter = !notification.completed;
        break;
      case "read":
        matchesFilter = notification.is_read;
        break;
      case "unread":
        matchesFilter = !notification.is_read;
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  currentPage = 1;
  displayNotifications();
  updateStatistics();
}

function updateStatistics() {
  const total = allNotifications.length;
  const read = allNotifications.filter((n) => n.is_read).length;
  const unread = total - read;

  document.getElementById(
    "totalNotifications"
  ).textContent = `Tổng số: ${total}`;
  document.getElementById("readNotifications").textContent = `Đã đọc: ${read}`;
  document.getElementById(
    "unreadNotifications"
  ).textContent = `Chưa đọc: ${unread}`;
}

function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Tên nhiệm vụ,Thông báo,Ngày hết hạn,Trạng thái\n";

  allNotifications.forEach((notification) => {
    const row = [
      notification.task_name,
      notification.message,
      notification.end_date,
      notification.completed ? "Đã hoàn thành" : "Chưa hoàn thành",
    ]
      .map((e) => `"${e}"`)
      .join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "thong_bao.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("vi-VN", options);
}

function displayError(message) {
  const notificationList = document.getElementById("allNotifications");
  notificationList.innerHTML = `<li class="error-message">${escapeHtml(
    message
  )}</li>`;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function handleStatisticsClick(event) {
  const clickedId = event.target.id;
  let filterValue;

  switch (clickedId) {
    case "totalNotifications":
      filterValue = "all";
      break;
    case "readNotifications":
      filterValue = "read";
      break;
    case "unreadNotifications":
      filterValue = "unread";
      break;
  }

  document.getElementById("filterSelect").value = filterValue;
  filterNotifications();
}
