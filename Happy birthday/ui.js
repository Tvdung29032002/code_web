// ui.js

import { initChatPopup, openChatPopup } from "./chat-popup.js";
import { ChatAPI } from "./messenger/chat-api.js";
import { ChatApp } from "./messenger/chat-app.js";

// Di chuyển hàm closeAllMenus ra ngoài
function closeAllMenus() {
  const menus = document.querySelectorAll(
    ".help-menu, .notification-menu, .settings-menu, .apps-menu, .dropdown-menu, .messenger-menu"
  );
  menus.forEach((menu) => {
    menu.classList.remove("show");
    const tooltipContainer = menu.closest(".tooltip-container");
    if (tooltipContainer) {
      tooltipContainer.classList.remove("menu-open");
    }
  });
}

export function displayMessengerMenu(users) {
  const messengerMenu = document.getElementById("messengerMenu");
  messengerMenu.innerHTML = `
    <div class="messenger-header">
      <span class="messenger-title">Tin nhắn</span>
      <a href="messenger/chat.html" class="new-message-btn">Tin nhắn mới</a>
    </div>
    <ul class="messenger-list">
      ${users
        .map(
          (user) => `
        <li class="messenger-item" data-user-id="${user.id}">
          <img src="${user.photo_url || "album/default-avatar.png"}" alt="${
            user.name
          }" class="messenger-avatar">
          <div class="messenger-content">
            <div class="messenger-name">${user.display_name || user.name}</div>
            <div class="messenger-preview">${
              user.is_group
                ? "Nhóm chat"
                : user.online_status
                ? "Đang hoạt động"
                : "Không hoạt động"
            }</div>
          </div>
          ${
            user.online_status && !user.is_group
              ? '<div class="online-indicator"></div>'
              : ""
          }
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  // Thêm sự kiện cho các mục người dùng
  const userItems = messengerMenu.querySelectorAll(".messenger-item");
  userItems.forEach((item) => {
    item.addEventListener("click", () => {
      const userId = item.dataset.userId;
      const user = users.find((u) => u.id == userId);
      if (user) {
        openChatPopup(user);
        closeAllMenus();
      }
    });
  });
}

export function initUI() {
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
  const openFeedbackButton = document.getElementById("open-feedback");
  const tooltipContainers = document.querySelectorAll(".tooltip-container");
  const citySelector = document.querySelector(".city-selector");
  const cityDropdown = document.querySelector(".city-dropdown");
  const settingsIcon = document.getElementById("settingsIcon");
  const settingsMenu = document.getElementById("settingsMenu");
  const overlay = document.querySelector(".overlay");

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

  function toggleTooltips(show) {
    tooltipContainers.forEach((container) => {
      if (show) {
        container.classList.remove("tooltip-disabled");
      } else {
        container.classList.add("tooltip-disabled");
      }
    });
  }

  function toggleMenu(menu, icon) {
    const isMenuOpen = menu.classList.contains("show");

    closeAllMenus();

    if (!isMenuOpen) {
      menu.classList.add("show");
      toggleTooltips(false);
      icon.closest(".tooltip-container").classList.add("menu-open");

      if (menu === messengerMenu) {
        ChatAPI.fetchAllUsers(ChatApp.currentUserId)
          .then((users) => {
            displayMessengerMenu(users);
          })
          .catch((error) => {});
      }
    } else {
      toggleTooltips(true);
      icon.closest(".tooltip-container").classList.remove("menu-open");
    }
  }

  // Cập nhật các event listener
  avatarIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(dropdownMenu, avatarIcon);
  });

  appsIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(appsMenu, appsIcon);
  });

  helpIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    toggleMenu(helpMenu, helpIcon);
  });

  notificationIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(notificationMenu, notificationIcon);
  });

  settingsIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(settingsMenu, settingsIcon);
  });

  openFeedbackButton.addEventListener("click", () => {
    window.location.href = "feedback/feedback.html";
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
      !citySelector.contains(event.target) &&
      !settingsIcon.contains(event.target) &&
      !settingsMenu.contains(event.target) &&
      !messengerIcon.contains(event.target) &&
      !messengerMenu.contains(event.target)
    ) {
      closeAllMenus();
    }
  });

  // Thêm các event listener sau vào cuối hàm initUI()
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.style.display = "block";
  });

  sidebarClose.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.style.display = "none";
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.style.display = "none";
  });

  // Thêm xử lý đóng sidebar khi click bên ngoài
  document.addEventListener("click", (event) => {
    if (!sidebar.contains(event.target) && event.target !== sidebarToggle) {
      sidebar.classList.remove("open");
      overlay.style.display = "none";
    }
  });

  // Initialize UI components
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

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

  document
    .querySelector(".dropdown-item:first-child")
    .addEventListener("click", function (e) {
      e.preventDefault();
      const username = localStorage.getItem("username");
      if (username) {
        window.location.href = "/personal-info/personal-info.html";
      } else {
        window.location.href = "http://192.168.0.103:5500/login/login.html";
      }
    });

  document
    .querySelector('.dropdown-item[onclick="logout()"]')
    .addEventListener("click", function (e) {
      e.preventDefault();
      // Implement logout logic here
    });

  settingsIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(settingsMenu, settingsIcon);
  });

  // Thêm xử lý messenger
  const messengerIcon = document.getElementById("messengerIcon");
  const messengerMenu = document.getElementById("messengerMenu");

  // Thay đổi event listener cho messengerIcon
  messengerIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(messengerMenu, messengerIcon);
  });

  initChatPopup();
}

export function checkUserRole() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
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
