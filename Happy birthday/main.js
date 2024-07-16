document.addEventListener("DOMContentLoaded", function () {
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
  const citySelect = document.getElementById("citySelect");

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

  function toggleTooltips(show) {
    const tooltipContainers = document.querySelectorAll(".tooltip-container");
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
    toggleTooltips(true);
  }

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
      !helpMenu.contains(event.target)
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

  const WEATHER_API_KEY = "b9381663fe86ade5d1325e6ed94197f6";
  console.log("WEATHER_API_KEY:", WEATHER_API_KEY);

  citySelect.addEventListener("change", function () {
    const [lat, lon] = this.value.split(",");
    console.log("Selected city coordinates:", lat, lon);
    if (lat && lon) {
      displayWeather(parseFloat(lat), parseFloat(lon));
    } else {
      console.error("Invalid coordinates selected");
    }
  });
  async function checkApiKey() {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${WEATHER_API_KEY}`
      );
      if (response.ok) {
        console.log("API key is valid");
      } else {
        console.error("API key may be invalid. Status:", response.status);
      }
    } catch (error) {
      console.error("Error checking API key:", error);
    }
  }

  checkApiKey();

  // Gọi displayWeather với vị trí mặc định (Hà Nội)
  displayWeather(21.0278, 105.8342);
});

async function displayWeather(lat, lon) {
  console.log("Displaying weather for lat:", lat, "lon:", lon);
  const weatherWidget = document.querySelector(".weather-widget");
  const temperature = document.querySelector(".temperature");

  try {
    temperature.textContent = "Loading...";
    const weatherData = await fetchWeatherData(lat, lon);
    console.log("Weather data received:", weatherData);
    if (weatherData && weatherData.main && weatherData.main.temp) {
      updateWeatherWidget(weatherData);
    } else {
      throw new Error("Invalid weather data received");
    }
  } catch (error) {
    console.error("Error in displayWeather:", error);
    temperature.textContent = "Weather unavailable";
    temperature.classList.add("error");
  }
}

async function fetchWeatherData(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
  console.log("Fetching weather data from:", url);
  try {
    const response = await fetch(url);
    console.log("Response status:", response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Weather API response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Network error. Please check your internet connection.");
    }
    throw error;
  }
}
function updateWeatherWidget(weatherData) {
  const weatherIcon = document.querySelector(".weather-icon");
  const temperature = document.querySelector(".temperature");

  const iconCode = weatherData.weather[0].icon;
  weatherIcon.src = `http://openweathermap.org/img/wn/${iconCode}.png`;
  temperature.textContent = `${Math.round(weatherData.main.temp)}°`;
  temperature.classList.remove("error");
}
