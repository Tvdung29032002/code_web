// ui.js

import { initChatPopup, openChatPopup } from "./chat-popup.js";
import { updateToggleIcon } from "./weather.js";

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

  function closeAllMenus() {
    const menus = [
      dropdownMenu,
      appsMenu,
      helpMenu,
      notificationMenu,
      messengerMenu,
      settingsMenu,
    ];
    menus.forEach((menu) => {
      if (menu.classList) {
        menu.classList.remove("show");
      } else {
        menu.style.display = "none";
      }
    });

    if (cityDropdown.style.display === "block") {
      cityDropdown.style.display = "none";
      updateToggleIcon(false);
    }

    toggleTooltips(true);

    document.querySelectorAll(".tooltip-container").forEach((container) => {
      container.classList.remove("menu-open");
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
        displayMessengerList();
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
        console.log("Username not found, redirecting to login");
        window.location.href = "login.html";
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

  initChatPopup();

  // Thêm event listener để đóng messengerMenu khi click bên ngoài
  document.addEventListener("click", function (event) {
    if (
      !messengerIcon.contains(event.target) &&
      !messengerMenu.contains(event.target)
    ) {
      messengerMenu.style.display = "none";
    }
  });

  // Cập nhật event listener cho messengerIcon
  messengerIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(messengerMenu, messengerIcon);
  });

  // Thêm vào hàm closeAllMenus()
  messengerMenu.style.display = "none";

  // Thêm hàm để hiển thị danh sách tin nhắn
  function displayMessengerList() {
    // Lấy thông tin người dùng hiện tại từ localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) {
      console.error("Không tìm thấy thông tin người dùng hiện tại");
      messengerMenu.innerHTML = "<p>Vui lòng đăng nhập để xem tin nhắn.</p>";
      return;
    }

    // Lấy danh sách người dùng từ server, loại trừ người dùng hiện tại
    fetch(`http://192.168.0.103:3000/api/chat-users/${currentUser.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const users = data.users;
          const messengerContent = `
            <div class="messenger-header">
              <span class="messenger-title">Tin nhắn</span>
              <a href="messenger/chat.html" class="new-message-btn">Xem tất cả</a>
            </div>
            <ul class="messenger-list">
              ${users
                .map(
                  (user) => `
                <li class="messenger-item" data-user-id="${user.id}">
                  <img src="${
                    user.photo_url || "/uploads/default-avatar.jpg"
                  }" alt="${user.name}" class="messenger-avatar">
                  <div class="messenger-content">
                    <div class="messenger-name">${user.name}</div>
                    <div class="messenger-preview">${
                      user.bio
                        ? user.bio.substring(0, 30) + "..."
                        : "Chưa có tiểu sử"
                    }</div>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>
          `;

          messengerMenu.innerHTML = messengerContent;

          // Thêm sự kiện click cho mỗi mục tin nhắn
          const messengerItems =
            messengerMenu.querySelectorAll(".messenger-item");
          messengerItems.forEach((item) => {
            item.addEventListener("click", function (event) {
              event.stopPropagation(); // Ngăn chặn sự kiện click lan ra document
              const userId = this.getAttribute("data-user-id");
              const user = users.find((u) => u.id.toString() === userId);
              if (user) {
                openChatPopup(user);
                messengerMenu.classList.remove("show"); // Đóng menu messenger sau khi mở chat
              }
            });
          });
        } else {
          throw new Error(data.message || "Không thể lấy danh sách người dùng");
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        messengerMenu.innerHTML = "<p>Không thể tải danh sách người dùng.</p>";
      });
  }

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
