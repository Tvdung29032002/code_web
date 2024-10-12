// tasks.js

export async function fetchTodayTasks() {
  const userId = localStorage.getItem("userId");
  console.log("UserId from localStorage:", userId);

  if (!userId) {
    return [];
  }

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/tasks/today/${userId}`
    );
    const data = await response.json();
    if (data.success) {
      return data.tasks;
    } else {
      console.error("Lỗi khi lấy nhiệm vụ ngày hiện tại:", data.message);
    }
  } catch (error) {
    console.error("Lỗi khi lấy nhiệm vụ ngày hiện tại:", error);
  }
  return [];
}

export function displayTodayTasks(tasks) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = "<li>Không có nhiệm vụ nào cho hôm nay</li>";
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <div class="task-info">
          <span class="task-name ${task.completed ? "completed" : ""}">${
      task.name
    }</span>
          <div class="task-details">
            <span class="task-type ${task.type}">${
      task.type === "english" ? "Tiếng Anh" : "Tiếng Trung"
    }</span>
            <span class="task-activity ${task.activity}">${
      task.activity === "vocabulary" ? "Từ vựng" : "Minigame"
    }</span>
          </div>
        </div>
        <div class="task-status">
          <span class="status-icon ${
            task.completed ? "completed" : "pending"
          }"></span>
          <span class="status-text">${
            task.completed ? "Đã hoàn thành" : "Chưa hoàn thành"
          }</span>
        </div>
      `;
    taskList.appendChild(li);
  });
}

export async function fetchUpcomingTasks() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.error("Không tìm thấy userId");
    return { notifications: [], unreadCount: 0 };
  }

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/all-notifications/${userId}`
    );
    const data = await response.json();
    if (data.success) {
      const notifications = data.notifications
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      const unreadCount = data.notifications.filter((n) => !n.is_read).length;
      return { notifications, unreadCount };
    } else {
      console.error("Lỗi khi lấy thông báo:", data.message);
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
  }
  return { notifications: [], unreadCount: 0 };
}

export function displayNotifications(notificationData) {
  const { notifications, unreadCount } = notificationData;
  const notificationMenu = document.getElementById("notificationMenu");
  notificationMenu.innerHTML = "";

  const notificationHeader = document.createElement("div");
  notificationHeader.className = "notification-header";
  notificationHeader.textContent = "Thông báo";
  notificationMenu.appendChild(notificationHeader);

  if (notifications.length === 0) {
    const emptyNotification = document.createElement("div");
    emptyNotification.className = "notification-empty";
    emptyNotification.textContent = "Không có thông báo mới";
    notificationMenu.appendChild(emptyNotification);
  } else {
    notifications.forEach((notification) => {
      const notificationItem = document.createElement("div");
      notificationItem.className = `notification-item ${
        notification.is_read ? "read" : "unread"
      }`;
      notificationItem.dataset.id = notification.id; // Thêm id của thông báo vào dataset
      notificationItem.innerHTML = `
        <div class="notification-icon">${getNotificationIcon(
          notification
        )}</div>
        <div class="notification-content">
          <div class="notification-message">${formatNotificationMessage(
            notification.message
          )}</div>
          <div class="notification-date">
            Ngày tạo: ${formatDate(notification.created_at)}
          </div>
        </div>
      `;
      notificationItem.addEventListener("click", handleNotificationClick);
      notificationMenu.appendChild(notificationItem);
    });
  }

  const viewAllButton = document.createElement("button");
  viewAllButton.className = "view-all-notifications";
  viewAllButton.textContent = "Xem tất cả";
  viewAllButton.onclick = () => {
    window.location.href = "/all-notifications/all-notifications.html";
  };
  notificationMenu.appendChild(viewAllButton);

  updateNotificationBadge(unreadCount);
}

function getNotificationIcon(notification) {
  if (notification.completed) {
    return "✅";
  } else if (notification.message.includes("hoàn thành")) {
    return "🏁";
  } else {
    return "📅";
  }
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

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Thêm hàm này để định dạng ngày tháng
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateNotificationBadge(unreadCount) {
  const notificationIcon = document.getElementById("notificationIcon");
  let countBadge = notificationIcon.parentElement.querySelector(
    ".notification-count"
  );

  if (unreadCount > 0) {
    if (!countBadge) {
      countBadge = document.createElement("span");
      countBadge.className = "notification-count";
      notificationIcon.parentElement.appendChild(countBadge);
    }
    countBadge.textContent = unreadCount;
  } else if (countBadge) {
    countBadge.remove();
  }
}

async function handleNotificationClick(event) {
  const notificationItem = event.currentTarget;
  const notificationId = notificationItem.dataset.id;

  if (notificationItem.classList.contains("unread")) {
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
        // Cập nhật giao diện cho thông báo hiện tại
        notificationItem.classList.remove("unread");
        notificationItem.classList.add("read");

        // Cập nhật số lượng thông báo chưa đọc
        const currentUnreadCount = parseInt(
          document.querySelector(".notification-count")?.textContent || "0"
        );
        const newUnreadCount = Math.max(currentUnreadCount - 1, 0);
        updateNotificationBadge(newUnreadCount);

        // Làm mới toàn bộ danh sách thông báo
        await updateNotifications();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đọc:", error);
    }
  }
}

// Cập nhật hàm updateNotifications để có thể sử dụng async/await
export async function updateNotifications() {
  const notificationData = await fetchUpcomingTasks();
  displayNotifications(notificationData);
}

// Đảm bảo rằng hàm này được export
export { handleNotificationClick };

export async function refreshNotifications() {
  const notificationData = await fetchUpcomingTasks();
  displayNotifications(notificationData);
}
