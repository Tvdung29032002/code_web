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
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.error("Response text:", text);
      throw new Error("Invalid JSON response");
    }
  } catch (error) {
    console.error("Error fetching cities:", error);
    const cityList = document.getElementById("cityList");
    cityList.innerHTML = `<li>Lỗi khi tải danh sách thành phố: ${error.message}</li>`;
  }
}

function updateToggleIcon(isOpen) {
  const toggleIcon = document.getElementById("toggleIcon");
  toggleIcon.src = isOpen
    ? "album/arrowhead-up.png"
    : "album/dropdown-arrow.png";
  toggleIcon.classList.toggle("up", isOpen);
}

function showCityList() {
  const cityList = document.getElementById("cityList");
  cityList.innerHTML = cities
    .map(
      (city) => `
    <li data-value="${city.coords}">
      ${city.name}
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

function toggleCityDropdown(e) {
  e.stopPropagation();
  const cityDropdown = document.querySelector(".city-dropdown");
  const isDropdownOpen = cityDropdown.style.display === "block";

  cityDropdown.style.display = isDropdownOpen ? "none" : "block";
  updateToggleIcon(!isDropdownOpen);

  if (!isDropdownOpen) {
    showCityList();
    document.getElementById("citySearch").focus();
  }
}

async function displayWeather(lat, lon) {
  console.log("Displaying weather for lat:", lat, "lon:", lon);
  const temperature = document.querySelector(".temperature");

  try {
    temperature.textContent = "Đang tải...";
    const weatherData = await fetchWeatherData(lat, lon);
    console.log("Weather data received:", weatherData);
    if (weatherData && weatherData.main && weatherData.main.temp) {
      updateWeatherWidget(weatherData);
    } else {
      throw new Error("Invalid weather data received");
    }
  } catch (error) {
    console.error("Error in displayWeather:", error);
    temperature.textContent = "Không có dữ liệu";
    temperature.classList.add("error");
  }
}

async function fetchWeatherData(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}&lang=vi`;
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
      console.error("Lỗi kết nối. Vui lòng kiểm tra kết nối internet của bạn.");
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

async function initWeather(
  toggleIcon,
  cityList,
  cityDropdown,
  citySearch,
  selectedCity
) {
  toggleIcon.addEventListener("click", toggleCityDropdown);

  cityList.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
      const [lat, lon] = e.target.getAttribute("data-value").split(",");
      currentCity = e.target.textContent.trim();
      selectedCity.innerHTML = `${currentCity} <img src="album/dropdown-arrow.png" id="toggleIcon" class="toggle-icon">`;
      displayWeather(parseFloat(lat), parseFloat(lon));

      cityDropdown.style.display = "none";
      updateToggleIcon(false);

      document
        .getElementById("toggleIcon")
        .addEventListener("click", toggleCityDropdown);

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

  await fetchCities();

  const defaultCity = cities.find((city) => city.name === "Hà Nội");
  if (defaultCity) {
    const [lat, lon] = defaultCity.coords.split(",");
    displayWeather(parseFloat(lat), parseFloat(lon));
  } else {
    console.error("Không tìm thấy thành phố mặc định");
  }
}

export { initWeather, showCityList, toggleCityDropdown, updateToggleIcon };
