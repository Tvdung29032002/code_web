// Khai báo WEATHER_API_KEY ở đầu file, ngoài tất cả các hàm
const WEATHER_API_KEY = "b9381663fe86ade5d1325e6ed94197f6";

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

function updateToggleIcon(isOpen) {
  const toggleIcon = document.getElementById("toggleIcon");
  if (isOpen) {
    toggleIcon.src = "album/arrowhead-up.png";
    toggleIcon.classList.add("up");
  } else {
    toggleIcon.src = "album/dropdown-arrow.png";
    toggleIcon.classList.remove("up");
  }
}

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

    if (cityDropdown.style.display === "block") {
      cityDropdown.style.display = "none";
      updateToggleIcon(false);
    }

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

  console.log("WEATHER_API_KEY:", WEATHER_API_KEY);

  // Khởi tạo danh sách thành phố
  const cities = [
    { name: "Hà Nội", coords: "21.0278,105.8342" },
    { name: "TP HCM", coords: "10.7769,106.7009" },
    { name: "Đà Nẵng", coords: "16.0544,108.2022" },
    { name: "An Giang", coords: "10.3844,105.4309" },
    { name: "Vũng Tàu", coords: "10.3460,107.0843" },
    { name: "Hải Phòng", coords: "20.8449,106.6881" },
    { name: "Huế", coords: "16.4637,107.5909" },
    { name: "Nha Trang", coords: "12.2388,109.1967" },
    { name: "Cần Thơ", coords: "10.0452,105.7469" },
    { name: "Quảng Ninh", coords: "20.9667,107.0907" },
    { name: "Bình Dương", coords: "11.1733,106.6894" },
    { name: "Đồng Nai", coords: "10.9453,106.8243" },
    { name: "Khánh Hòa", coords: "12.2585,109.0453" },
    { name: "Lâm Đồng", coords: "11.9404,108.4583" },
    { name: "Thái Nguyên", coords: "21.5942,105.8480" },
    { name: "Thanh Hóa", coords: "19.8067,105.7771" },
    { name: "Nghệ An", coords: "18.6667,105.6667" },
    { name: "Hà Tĩnh", coords: "18.3428,105.9057" },
    { name: "Quảng Bình", coords: "17.4834,106.6004" },
    { name: "Quảng Trị", coords: "16.75,107.2" },
    { name: "Quảng Nam", coords: "15.5735,108.4740" },
    { name: "Quảng Ngãi", coords: "15.1205,108.7922" },
    { name: "Bình Định", coords: "13.7820,109.2195" },
    { name: "Phú Yên", coords: "13.0955,109.3209" },
    { name: "Bình Thuận", coords: "10.9804,108.2615" },
    { name: "Gia Lai", coords: "13.9661,108.0191" },
    { name: "Đắk Lắk", coords: "12.6904,108.0378" },
    { name: "Đắk Nông", coords: "12.2070,107.7055" },
    { name: "Kon Tum", coords: "14.3535,108.0000" },
    { name: "Tiền Giang", coords: "10.3589,106.3630" },
    { name: "Bến Tre", coords: "10.2334,106.3755" },
    { name: "Trà Vinh", coords: "9.9466,106.3442" },
    { name: "Vĩnh Long", coords: "10.2537,105.9722" },
    { name: "Đồng Tháp", coords: "10.4939,105.6882" },
    { name: "Hậu Giang", coords: "9.7844,105.4701" },
    { name: "Sóc Trăng", coords: "9.6030,105.9739" },
    { name: "Bạc Liêu", coords: "9.2761,105.7216" },
    { name: "Cà Mau", coords: "9.1768,105.1524" },
    { name: "Lai Châu", coords: "22.3964,103.4526" },
    { name: "Lào Cai", coords: "22.4856,103.9706" },
    { name: "Yên Bái", coords: "21.7229,104.9113" },
    { name: "Tuyên Quang", coords: "21.8285,105.2148" },
    { name: "Hà Giang", coords: "22.8233,104.9847" },
    { name: "Cao Bằng", coords: "22.6657,106.2570" },
    { name: "Bắc Kạn", coords: "22.1448,105.8348" },
    { name: "Lạng Sơn", coords: "21.8456,106.7570" },
    { name: "Bắc Giang", coords: "21.2731,106.1945" },
    { name: "Bắc Ninh", coords: "21.1861,106.0763" },
    { name: "Phú Thọ", coords: "21.3220,105.4027" },
    { name: "Hòa Bình", coords: "20.8172,105.3376" },
    { name: "Sơn La", coords: "21.3286,103.9098" },
    { name: "Điện Biên", coords: "21.3860,103.0230" },
    { name: "Hưng Yên", coords: "20.6460,106.0511" },
    { name: "Hải Dương", coords: "20.9373,106.3147" },
    { name: "Thái Bình", coords: "20.4487,106.3400" },
    { name: "Nam Định", coords: "20.4388,106.1773" },
    { name: "Ninh Bình", coords: "20.2508,105.9740" },
  ];

  let currentCity = "Hà Nội"; // Thành phố mặc định

  // Hiển thị danh sách thành phố
  function showCityList() {
    cityList.innerHTML = "";
    cities.forEach((city) => {
      const li = document.createElement("li");
      li.textContent = city.name;
      if (city.name === currentCity) {
        li.innerHTML +=
          ' <img src="album/location-icon.png" class="location-icon" alt="Đang chọn">';
      }
      li.setAttribute("data-value", city.coords);
      cityList.appendChild(li);
    });
  }

  // Tạo hàm riêng để xử lý việc toggle dropdown
  function toggleCityDropdown(e) {
    e.stopPropagation();
    const isDropdownOpen = cityDropdown.style.display === "block";

    if (!isDropdownOpen) {
      cityDropdown.style.display = "block";
      updateToggleIcon(true);
      showCityList();
      citySearch.focus();
    } else {
      cityDropdown.style.display = "none";
      updateToggleIcon(false);
    }
  }

  // Gán sự kiện click cho toggleIcon ban đầu
  toggleIcon.addEventListener("click", toggleCityDropdown);

  // Xử lý khi chọn thành phố
  cityList.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
      const [lat, lon] = e.target.getAttribute("data-value").split(",");
      currentCity = e.target.textContent;
      selectedCity.innerHTML = `${currentCity} <img src="album/dropdown-arrow.png" id="toggleIcon" class="toggle-icon">`;
      displayWeather(parseFloat(lat), parseFloat(lon));

      // Đóng dropdown sau khi chọn
      cityDropdown.style.display = "none";
      updateToggleIcon(false);

      // Cập nhật lại sự kiện click cho toggleIcon mới
      document
        .getElementById("toggleIcon")
        .addEventListener("click", toggleCityDropdown);

      showCityList(); // Cập nhật lại danh sách để di chuyển location-icon
    }
  });

  // Xử lý tìm kiếm thành phố
  citySearch.addEventListener("input", function () {
    const searchText = this.value.toLowerCase();
    const items = cityList.getElementsByTagName("li");
    for (let item of items) {
      const itemText = item.textContent.toLowerCase();
      if (itemText.includes(searchText)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
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
