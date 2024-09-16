// tasks.js

export async function fetchTodayTasks() {
  const userId = localStorage.getItem("userId");
  console.log("UserId from localStorage:", userId);

  if (!userId) {
    console.error("Không tìm thấy userId");
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
    return [];
  }

  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/upcoming-tasks/${userId}`
    );
    const data = await response.json();
    if (data.success) {
      return data.tasks;
    } else {
      console.error("Lỗi khi lấy nhiệm vụ sắp đến hạn:", data.message);
    }
  } catch (error) {
    console.error("Lỗi khi lấy nhiệm vụ sắp đến hạn:", error);
  }
  return [];
}

export function displayNotifications(tasks) {
  const notificationMenu = document.getElementById("notificationMenu");
  notificationMenu.innerHTML = "";

  if (tasks.length === 0) {
    notificationMenu.innerHTML =
      "<div class='notification-empty'>Không có thông báo mới</div>";
    return;
  }

  const notificationHeader = document.createElement("div");
  notificationHeader.className = "notification-header";
  notificationHeader.textContent = "Thông báo";
  notificationMenu.appendChild(notificationHeader);

  tasks.forEach((task) => {
    const notification = document.createElement("div");
    notification.className = "notification-item";
    notification.innerHTML = `
        <div class="notification-icon">${task.completed ? "✅" : "📅"}</div>
        <div class="notification-content">
          <div class="notification-title">${task.task_name}</div>
          <div class="notification-message">
            ${
              task.completed ? "Nhiệm vụ đã hoàn thành" : "Nhiệm vụ sắp đến hạn"
            }
          </div>
          <div class="notification-date">Hạn: ${formatDate(task.end_date)}</div>
          <div class="notification-status ${
            task.completed ? "completed" : "pending"
          }">
            ${task.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
          </div>
        </div>
      `;
    notificationMenu.appendChild(notification);
  });

  const viewAllButton = document.createElement("button");
  viewAllButton.className = "view-all-notifications";
  viewAllButton.textContent = "Xem tất cả";
  viewAllButton.onclick = () => {
    // Implement view all notifications logic
  };
  notificationMenu.appendChild(viewAllButton);
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("vi-VN", options);
}
