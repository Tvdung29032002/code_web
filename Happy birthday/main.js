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

// Hàm khởi tạo chatbot
function initChatbot() {
  const chatbotWrapper = document.getElementById("chatbot-container");
  const openChatbotBtn = document.getElementById("open-chatbot");
  const chatbotIframeContainer = document.getElementById(
    "chatbot-iframe-container"
  );
  const chatbotIframe = document.getElementById("chatbot-iframe");

  if (chatbotIframeContainer && chatbotIframe && openChatbotBtn) {
    chatbotIframe.onload = function () {
      chatbotIframe.contentWindow.postMessage("initializeChatbot", "*");
    };

    // Sửa đổi sự kiện click cho nút mở chatbot
    openChatbotBtn.addEventListener("click", function () {
      if (chatbotIframeContainer.style.display === "none") {
        chatbotIframeContainer.style.display = "block";
        openChatbotBtn.innerHTML = '<i class="fas fa-times"></i>';
      } else {
        chatbotIframeContainer.style.display = "none";
        openChatbotBtn.innerHTML = '<i class="fas fa-robot"></i>';
      }
    });

    // Đảm bảo rằng trạng thái ban đầu là ẩn
    chatbotIframeContainer.style.display = "none";
    openChatbotBtn.innerHTML = '<i class="fas fa-robot"></i>';
  } else {
    // Xóa console.error ở đây
  }

  // Xóa console.log ở đây
}

// Hàm khởi tạo ứng dụng
async function initApp() {
  createChatPopupsContainer();
  initUI();

  const todayTasks = await fetchTodayTasks();
  displayTodayTasks(todayTasks);

  const upcomingTasks = await fetchUpcomingTasks();
  displayNotifications(upcomingTasks);

  const notificationIcon = document.getElementById("notificationIcon");
  const notificationCount = document.createElement("span");
  notificationCount.className = "notification-count";
  notificationCount.textContent = upcomingTasks.length;
  notificationIcon.appendChild(notificationCount);

  await initWeather(
    document.getElementById("cityList"),
    document.querySelector(".city-dropdown"),
    document.getElementById("citySearch"),
    document.getElementById("selectedCity")
  );

  const toggleButton = document.getElementById("toggleCityDropdown");
  toggleButton.addEventListener("click", toggleCityDropdown);

  checkUserRole();
  ChatApp.initWebSocket();

  if (window.location.pathname.includes("messenger")) {
    ChatApp.init();
  } else {
    ChatApp.initForHomepage();
    ChatApp.handleNewMessage = handleNewMessageHomepage;
  }

  initChatPopup();
}

// Khởi chạy ứng dụng khi tài liệu đã sẵn sàng
document.addEventListener("DOMContentLoaded", initApp);

// Cập nhật trạng thái trực tuyến khi đóng trang
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

// Đảm bảo rằng hàm này được gọi khi trang đã tải xong
document.addEventListener("DOMContentLoaded", function () {
  // Xóa console.log ở đây
  initChatbot();
});

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", function () {
    const links =
      this.closest(".sidebar-section").querySelector(".sidebar-links");
    if (links.style.display === "none" || links.style.display === "") {
      links.style.display = "block";
      this.textContent = "-";
    } else {
      links.style.display = "none";
      this.textContent = "+";
    }
  });
});
