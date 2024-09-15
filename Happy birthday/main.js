// Import các hàm từ weather.js
import { initWeather, updateToggleIcon } from "./weather.js";

function checkUserRole() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  console.log("Checking user role:", currentUser?.role);
  if (currentUser && currentUser.role === "Admin") {
    document
      .querySelectorAll(".admin-only")
      .forEach((el) => (el.style.display = "block"));
  } else {
    document
      .querySelectorAll(".admin-only")
      .forEach((el) => (el.style.display = "none"));
  }
}

// Khai báo các biến và hàm cần thiết
document.addEventListener("DOMContentLoaded", async function () {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarClose = document.getElementById("sidebarClose");
  const sidebar = document.getElementById("sidebar-menu");
  const avatarIcon = document.getElementById("avatarIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const appsIcon = document.getElementById("appsIcon");
  const appsMenu = document.getElementById("appsMenu");
  const helpIcon = document.getElementById("helpIcon");
  const helpMenu = document.getElementById("helpMenu");
  const notificationIcon = document.getElementById("notificationIcon");
  const notificationMenu = document.getElementById("notificationMenu");
  const feedbackContainer = document.getElementById("feedback-container");
  const feedbackOverlay = document.getElementById("feedback-overlay");
  const openFeedbackButton = document.getElementById("open-feedback");
  const closeFeedbackButton = document.getElementById("close-feedback");
  const tooltipContainers = document.querySelectorAll(".tooltip-container");
  const citySelector = document.querySelector(".city-selector");
  const selectedCity = document.getElementById("selectedCity");
  const cityDropdown = document.querySelector(".city-dropdown");
  const citySearch = document.getElementById("citySearch");
  const cityList = document.getElementById("cityList");
  const toggleIcon = document.getElementById("toggleIcon");

  // Object chứa các URL cho từng ứng dụng
  const appUrls = {
    Calendar: "https://calendar.google.com",
    Gmail: "https://mail.google.com",
    Maps: "https://www.google.com/maps",
    YouTube: "https://www.youtube.com",
    Vnexpress: "https://vnexpress.net",
    Tiktok: "https://www.tiktok.com",
    Messenger: "https://www.messenger.com",
    Facebook: "https://www.facebook.com",
    Instagram: "https://www.instagram.com",
    "Chat GPT": "https://chat.openai.com",
    Claude: "https://www.anthropic.com",
    Gemini: "https://gemini.google.com",
    Blackbox: "https://www.blackbox.ai",
  };

  // Cập nhật thời gian hiện tại
  function updateCurrentTime() {
    const now = new Date();
    const dateOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };

    const dateString = now.toLocaleDateString("vi-VN", dateOptions);
    const timeString = now.toLocaleTimeString("vi-VN", timeOptions);
    const seconds = now.getSeconds().toString().padStart(2, "0");

    const dateElement = document.querySelector("#current-time .date");
    const timeElement = document.querySelector("#current-time .time");

    dateElement.textContent = dateString;
    timeElement.innerHTML = `${timeString}<span class="seconds">:${seconds}</span>`;
  }

  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // Xử lý chuyển hướng cho các ứng dụng trong menu-app
  const appItems = document.querySelectorAll(".apps-item");
  appItems.forEach((item) => {
    item.addEventListener("click", function () {
      const appName = this.textContent.trim();
      const appUrl = appUrls[appName];
      if (appUrl) {
        window.open(appUrl, "_blank");
      }
    });
  });

  // Các hàm xử lý giao diện
  function toggleTooltips(show) {
    tooltipContainers.forEach((container) => {
      if (show) {
        container.classList.remove("tooltip-disabled");
      } else {
        container.classList.add("tooltip-disabled");
      }
    });
  }

  function closeAllMenus() {
    dropdownMenu.style.display = "none";
    appsMenu.classList.remove("show");
    helpMenu.style.display = "none";
    notificationMenu.style.display = "none";

    if (cityDropdown.style.display === "block") {
      cityDropdown.style.display = "none";
      updateToggleIcon(false);
    }

    toggleTooltips(true);
  }

  // Xử lý sự kiện cho các phần tử giao diện
  sidebarToggle.addEventListener("click", function () {
    sidebar.classList.add("open");
  });

  sidebarClose.addEventListener("click", function () {
    sidebar.classList.remove("open");
  });

  avatarIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    const isMenuOpen = dropdownMenu.style.display === "block";
    closeAllMenus();
    if (!isMenuOpen) {
      dropdownMenu.style.display = "block";
      toggleTooltips(false);
    }
  });

  appsIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    const isMenuOpen = appsMenu.classList.contains("show");
    closeAllMenus();
    if (!isMenuOpen) {
      appsMenu.classList.add("show");
      toggleTooltips(false);
    }
  });

  helpIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    const isMenuOpen = helpMenu.style.display === "block";
    closeAllMenus();
    if (!isMenuOpen) {
      helpMenu.style.display = "block";
      toggleTooltips(false);
    }
  });

  notificationIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    const isMenuOpen = notificationMenu.style.display === "block";
    closeAllMenus();
    if (!isMenuOpen) {
      notificationMenu.style.display = "block";
      toggleTooltips(false);
    } else {
      toggleTooltips(true);
    }
  });

  openFeedbackButton.addEventListener("click", function () {
    feedbackContainer.style.display = "block";
    feedbackOverlay.style.display = "block";
    toggleTooltips(false);
  });

  closeFeedbackButton.addEventListener("click", function () {
    feedbackContainer.style.display = "none";
    feedbackOverlay.style.display = "none";
    toggleTooltips(true);
  });

  feedbackOverlay.addEventListener("click", function () {
    feedbackContainer.style.display = "none";
    feedbackOverlay.style.display = "none";
    toggleTooltips(true);
  });

  const feedbackOptions = document.querySelectorAll(".feedback-option");
  feedbackOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      console.log("Người dùng đã chọn:", this.querySelector("h3").textContent);
      feedbackContainer.style.display = "none";
      feedbackOverlay.style.display = "none";
      toggleTooltips(true);
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !notificationIcon.contains(event.target) &&
      !notificationMenu.contains(event.target) &&
      !avatarIcon.contains(event.target) &&
      !dropdownMenu.contains(event.target) &&
      !appsIcon.contains(event.target) &&
      !appsMenu.contains(event.target) &&
      !helpIcon.contains(event.target) &&
      !helpMenu.contains(event.target) &&
      !citySelector.contains(event.target)
    ) {
      closeAllMenus();
    }
  });

  document
    .querySelector(".dropdown-item:first-child")
    .addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "personal-info.html";
    });

  document
    .querySelector('.dropdown-item[onclick="logout()"]')
    .addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Đăng xuất");
    });

  // Thêm xử lý cho nút "Thông tin cá nhân"
  const personalInfoButton = document.querySelector(
    ".dropdown-item:first-child"
  );
  personalInfoButton.addEventListener("click", function (e) {
    e.preventDefault();
    const username = localStorage.getItem("username");
    if (username) {
      window.location.href = "personal-info.html";
    } else {
      console.log("Username not found, redirecting to login");
      window.location.href = "login.html";
    }
  });

  // Thêm hàm mới để lấy nhiệm vụ của ngày hiện tại
  async function fetchTodayTasks() {
    const userId = localStorage.getItem("userId");
    console.log("UserId from localStorage:", userId); // Thêm log này

    if (!userId) {
      console.error("Không tìm thấy userId");
      // Có thể thêm xử lý khác ở đây, ví dụ: chuyển hướng đến trang đăng nhập
      // window.location.href = "login.html";
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

  // Hàm để hiển thị nhiệm vụ
  function displayTodayTasks(tasks) {
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

  // Thêm hàm mới để lấy nhiệm vụ sắp đến hạn
  async function fetchUpcomingTasks() {
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

  // Hàm để hiển thị thông báo nhiệm vụ
  function displayNotifications(tasks) {
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

  // Thêm hàm formatDate nếu chưa có
  function formatDate(dateString) {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  }

  // Cập nhật hàm DOMContentLoaded để bao gồm việc lấy và hiển thị nhiệm vụ
  const todayTasks = await fetchTodayTasks();
  displayTodayTasks(todayTasks);

  const upcomingTasks = await fetchUpcomingTasks();
  displayNotifications(upcomingTasks);

  // Cập nhật số lượng thông báo
  const notificationCount = document.createElement("span");
  notificationCount.className = "notification-count";
  notificationCount.textContent = upcomingTasks.length;
  notificationIcon.appendChild(notificationCount);

  // Khởi tạo weather
  await initWeather(
    toggleIcon,
    cityList,
    cityDropdown,
    citySearch,
    selectedCity
  );

  // Kiểm tra và áp dụng phân quyền
  checkUserRole();
});
