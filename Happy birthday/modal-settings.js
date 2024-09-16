// Đặt tất cả code vào trong một hàm và gọi nó khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", function () {
  // Lấy các phần tử DOM
  const darkModeToggle = document.getElementById("darkModeToggle");
  const languageSelect = document.getElementById("languageSelect");
  const widgetWeather = document.getElementById("widgetWeather");
  const widgetTasks = document.getElementById("widgetTasks");
  const privacyProfile = document.getElementById("privacyProfile");
  const privacyActivity = document.getElementById("privacyActivity");

  // Hàm để lưu cài đặt vào localStorage
  function saveSettings() {
    const settings = {
      darkMode: darkModeToggle ? darkModeToggle.checked : false,
      language: languageSelect ? languageSelect.value : "vi",
      widgets: {
        weather: widgetWeather ? widgetWeather.checked : false,
        tasks: widgetTasks ? widgetTasks.checked : false,
      },
      privacy: {
        profile: privacyProfile ? privacyProfile.checked : false,
        activity: privacyActivity ? privacyActivity.checked : false,
      },
    };
    localStorage.setItem("userSettings", JSON.stringify(settings));
    applyLanguage(settings.language);
  }

  // Hàm để áp dụng ngôn ngữ
  function applyLanguage(language) {
    document.documentElement.lang = language;
    updatePageTexts(language);
  }

  // Hàm để tải cài đặt từ localStorage
  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode || false;
    if (languageSelect) {
      languageSelect.value = settings.language || "vi";
      applyLanguage(settings.language || "vi");
    }
    if (widgetWeather)
      widgetWeather.checked = settings.widgets?.weather || false;
    if (widgetTasks) widgetTasks.checked = settings.widgets?.tasks || false;
    if (privacyProfile)
      privacyProfile.checked = settings.privacy?.profile || false;
    if (privacyActivity)
      privacyActivity.checked = settings.privacy?.activity || false;

    // Áp dụng cài đặt
    applySettings(settings);
  }

  // Hàm để áp dụng cài đặt
  function applySettings(settings) {
    // Áp dụng chế độ tối
    if (settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    // Áp dụng cài đặt widget
    const weatherWidget = document.querySelector(".weather-widget");
    if (weatherWidget) {
      weatherWidget.style.display = settings.widgets?.weather ? "flex" : "none";
    }
    const todayTasks = document.getElementById("todayTasks");
    if (todayTasks) {
      todayTasks.style.display = settings.widgets?.tasks ? "block" : "none";
    }

    // Cập nhật trạng thái của toggle
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode || false;
  }

  // Hàm để lưu cài đặt vào localStorage và refresh trang
  function saveSettingsAndRefresh() {
    saveSettings();
    // Refresh trang
    window.location.reload();
  }

  // Hàm để cập nhật văn bản trên trang
  function updatePageTexts(language) {
    const translations = {
      vi: {
        homeTitle: "Trang chủ",
        searchPlaceholder: "Tìm kiếm",
        // Thêm các bản dịch khác cho tiếng Việt
      },
      en: {
        homeTitle: "Home",
        searchPlaceholder: "Search",
        // Thêm các bản dịch khác cho tiếng Anh
      },
      // Thêm các ngôn ngữ khác nếu cần
    };

    const currentTranslations = translations[language] || translations.vi;

    // Cập nhật các phần tử trên trang
    document.title = currentTranslations.homeTitle;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.placeholder = currentTranslations.searchPlaceholder;
    }
    // Cập nhật các phần tử khác tương tự
  }

  // Thêm sự kiện lắng nghe cho các phần tử cài đặt
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", function () {
      const settings = {
        darkMode: this.checked,
        widgets: {
          weather: widgetWeather.checked,
          tasks: widgetTasks.checked,
        },
      };
      saveSettings();
      applySettings(settings);
    });
  }

  if (languageSelect) languageSelect.addEventListener("change", saveSettings);
  if (widgetWeather)
    widgetWeather.addEventListener("change", saveSettingsAndRefresh);
  if (widgetTasks)
    widgetTasks.addEventListener("change", saveSettingsAndRefresh);
  if (privacyProfile) privacyProfile.addEventListener("change", saveSettings);
  if (privacyActivity) privacyActivity.addEventListener("change", saveSettings);

  // Tải cài đặt khi trang được tải
  loadSettings();

  // Xử lý việc mở/đóng menu cài đặt
  const settingsIcon = document.getElementById("settingsIcon");
  const settingsMenu = document.getElementById("settingsMenu");

  if (settingsIcon && settingsMenu) {
    settingsIcon.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleSettingsMenu();
    });

    // Đóng menu cài đặt khi click bên ngoài
    document.addEventListener("click", function (event) {
      if (
        !settingsMenu.contains(event.target) &&
        event.target !== settingsIcon
      ) {
        settingsMenu.style.display = "none";
      }
    });

    // Ngăn chặn việc đóng menu khi click vào bên trong menu
    settingsMenu.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  } else {
    console.error("Settings icon or menu not found");
  }

  function toggleSettingsMenu() {
    if (settingsMenu) {
      settingsMenu.classList.toggle("show");
    }
  }
});
