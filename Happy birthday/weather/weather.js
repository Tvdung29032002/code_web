const WEATHER_API_KEY = "b9381663fe86ade5d1325e6ed94197f6";

let currentCity = "Hà Nội";
let cities = [];

async function fetchCities() {
  try {
    const response = await fetch("http://192.168.0.103:3000/api/weather");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    try {
      cities = JSON.parse(text);
      showCityList();
      return cities;
    } catch (parseError) {
      throw new Error("Invalid JSON response");
    }
  } catch (error) {
    const cityList = document.getElementById("cityList");
    cityList.innerHTML = `<li>Lỗi khi tải danh sách thành phố: ${error.message}</li>`;
    return [];
  }
}

function updateToggleIcon(isOpen) {
  const toggleButton = document.getElementById("toggleCityDropdown");
  if (toggleButton) {
    toggleButton.classList.toggle("up", isOpen);
  }
}

function showCityList() {
  const cityList = document.getElementById("cityList");
  if (!cityList) {
    return;
  }
  cityList.innerHTML = cities
    .map(
      (city) => `
    <li data-value="${city.coords}">
      <span>${city.name}</span>
      ${
        city.name === currentCity
          ? '<img src="album/location-icon.png" class="location-icon" alt="Đang chọn">'
          : ""
      }
    </li>
  `
    )
    .join("");
}

function toggleCityDropdown() {
  const cityDropdown = document.querySelector(".city-dropdown");
  const toggleButton = document.getElementById("toggleCityDropdown");
  cityDropdown.classList.toggle("show");
  toggleButton.classList.toggle("up");

  if (cityDropdown.classList.contains("show")) {
    showCityList();
    document.getElementById("citySearch").focus();
  }
}

async function displayWeather(lat, lon) {
  const temperature = document.querySelector(".temperature");

  try {
    temperature.textContent = "Đang tải...";
    const weatherData = await fetchWeatherData(lat, lon);
    if (weatherData && weatherData.main && weatherData.main.temp) {
      updateWeatherWidget(weatherData);
    } else {
      throw new Error("Invalid weather data received");
    }
  } catch (error) {
    temperature.textContent = "Không có dữ liệu";
    temperature.classList.add("error");
  }
}

async function fetchWeatherData(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}&lang=vi`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      // Có thể xử lý lỗi kết nối ở đây nếu cần
    }
    throw error;
  }
}

function updateWeatherWidget(weatherData) {
  const weatherIcon = document.querySelector(".weather-icon");
  const temperature = document.querySelector(".temperature");
  const tooltip = document.querySelector(".weather-tooltip-text");

  const iconMap = {
    "01d": "wi-day-sunny",
    "01n": "wi-night-clear",
    "02d": "wi-day-cloudy",
    "02n": "wi-night-alt-cloudy",
    "03d": "wi-cloud",
    "03n": "wi-cloud",
    "04d": "wi-cloudy",
    "04n": "wi-cloudy",
    "09d": "wi-showers",
    "09n": "wi-showers",
    "10d": "wi-day-rain",
    "10n": "wi-night-alt-rain",
    "11d": "wi-thunderstorm",
    "11n": "wi-thunderstorm",
    "13d": "wi-snow",
    "13n": "wi-snow",
    "50d": "wi-fog",
    "50n": "wi-fog",
  };

  const iconCode = weatherData.weather[0].icon;
  const iconClass = iconMap[iconCode] || "wi-na";

  weatherIcon.className = `weather-icon wi ${iconClass}`;
  temperature.textContent = `${Math.round(weatherData.main.temp)}°C`;

  const description = weatherData.weather[0].description;
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind.speed;
  const feelsLike = Math.round(weatherData.main.feels_like);

  tooltip.innerHTML = `
    <h3>${currentCity}</h3>
    <p><span class="label">Mô tả:</span> <span class="value">${description}</span></p>
    <p><span class="label">Cảm giác như:</span> <span class="value">${feelsLike}°C</span></p>
    <p><span class="label">Độ ẩm:</span> <span class="value">${humidity}%</span></p>
    <p><span class="label">Tốc độ gió:</span> <span class="value">${windSpeed} m/s</span></p>
  `;

  temperature.classList.remove("error");
}

async function initWeather(cityList, cityDropdown, citySearch, selectedCity) {
  // Fetch cities first
  const fetchedCities = await fetchCities();

  if (fetchedCities.length === 0) {
    console.error("No cities fetched");
    return;
  }

  // Thêm event listener cho nút toggle
  const toggleButton = document.getElementById("toggleCityDropdown");
  toggleButton.addEventListener("click", toggleCityDropdown);

  // Sử dụng event delegation cho selectedCity
  selectedCity.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("toggle-icon") ||
      e.target.closest(".toggle-icon")
    ) {
      toggleCityDropdown(e);
    }
  });

  cityList.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
      const [lat, lon] = e.target.getAttribute("data-value").split(",");
      currentCity = e.target.textContent.trim();
      selectedCity.querySelector(".city-name").textContent = currentCity;
      displayWeather(parseFloat(lat), parseFloat(lon));

      cityDropdown.classList.remove("show");
      updateToggleIcon(false);

      showCityList();
    }
  });

  citySearch.addEventListener("input", function () {
    const searchText = this.value.toLowerCase();
    const items = cityList.getElementsByTagName("li");
    Array.from(items).forEach((item) => {
      const itemText = item.textContent.toLowerCase();
      item.style.display = itemText.includes(searchText) ? "" : "none";
    });
  });

  const defaultCity = cities.find((city) => city.name === "Hà Nội");
  if (defaultCity) {
    const [lat, lon] = defaultCity.coords.split(",");
    displayWeather(parseFloat(lat), parseFloat(lon));
    currentCity = "Hà Nội";
    selectedCity.querySelector(".city-name").textContent = currentCity;
  } else {
    console.error("Không tìm thấy thành phố mặc định");
  }
}

export { initWeather, showCityList, toggleCityDropdown, updateToggleIcon };
