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
import { initWeather } from "./weather.js";

// Initialize the application
async function initApp() {
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
  const toggleIcon = document.getElementById("toggleIcon");
  const cityList = document.getElementById("cityList");
  const cityDropdown = document.querySelector(".city-dropdown");
  const citySearch = document.getElementById("citySearch");
  const selectedCity = document.getElementById("selectedCity");

  await initWeather(
    toggleIcon,
    cityList,
    cityDropdown,
    citySearch,
    selectedCity
  );

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
