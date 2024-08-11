// Import các hàm từ weather.js
import { initWeather, updateToggleIcon } from "./weather.js";

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

  window.addEventListener("click", (event) => {
    if (
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

  // Khởi tạo weather
  await initWeather(
    toggleIcon,
    cityList,
    cityDropdown,
    citySearch,
    selectedCity
  );
});
