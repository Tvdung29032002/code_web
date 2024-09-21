// main.js

import { handleNewMessageHomepage, initChatPopup } from "./chat-popup.js";
import { ChatApp } from "./messenger/chat-app.js";
import {
  displayNotifications,
  displayTodayTasks,
  fetchTodayTasks,
  fetchUpcomingTasks,
} from "./tasks.js";
import { checkUserRole, initUI } from "./ui.js";
import { initWeather, toggleCityDropdown } from "./weather/weather.js";

// Thêm hàm mới để tạo container cho chat popups
function createChatPopupsContainer() {
  const container = document.createElement("div");
  container.id = "chat-popups-container";
  document.body.appendChild(container);
}

// Sửa đổi hàm initApp
async function initApp() {
  // Thêm dòng này để tạo container cho chat popups
  createChatPopupsContainer();

  // Initialize UI
  initUI();

  // Fetch and display tasks
  const todayTasks = await fetchTodayTasks();
  displayTodayTasks(todayTasks);

  const upcomingTasks = await fetchUpcomingTasks();
  displayNotifications(upcomingTasks);

  // Update notification count
  const notificationIcon = document.getElementById("notificationIcon");
  const notificationCount = document.createElement("span");
  notificationCount.className = "notification-count";
  notificationCount.textContent = upcomingTasks.length;
  notificationIcon.appendChild(notificationCount);

  // Initialize weather
  await initWeather(
    document.getElementById("cityList"),
    document.querySelector(".city-dropdown"),
    document.getElementById("citySearch"),
    document.getElementById("selectedCity")
  );

  // Add event listener for toggle button
  const toggleButton = document.getElementById("toggleCityDropdown");
  toggleButton.addEventListener("click", toggleCityDropdown);

  // Check and apply user role permissions
  checkUserRole();

  // Initialize WebSocket connection
  ChatApp.initWebSocket();

  // Khởi tạo ChatApp
  if (window.location.pathname.includes("messenger")) {
    ChatApp.init();
  } else {
    ChatApp.initForHomepage();
    // Thêm xử lý tin nhắn mới cho trang chủ
    ChatApp.handleNewMessage = handleNewMessageHomepage;
  }

  // Khởi tạo chat popup chỉ khi ở trang chủ
  if (
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html"
  ) {
    initChatPopup();
  }
}

// Call initApp when the document is ready
document.addEventListener("DOMContentLoaded", initApp);

// Update online status when closing the page
window.addEventListener("beforeunload", function (e) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser && currentUser.id) {
    const data = JSON.stringify({
      user_id: currentUser.id,
      online_status: false,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/update-online-status", data);
    } else {
      fetch("/api/update-online-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
        keepalive: true,
      });
    }
  }
});

// Cập nhật last_activity mỗi 5 phút
setInterval(() => {
  if (ChatApp.currentUserId) {
    ChatApp.updateLastActivity();
  }
}, 5 * 60 * 1000);
