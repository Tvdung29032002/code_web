document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", function () {
      var sidebar = document.getElementById("sidebar-menu");
      sidebar.classList.add("open");
    });

  document
    .getElementById("sidebarClose")
    .addEventListener("click", function () {
      var sidebar = document.getElementById("sidebar-menu");
      sidebar.classList.remove("open");
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const avatarIcon = document.getElementById("avatarIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");

  avatarIcon.addEventListener("click", (event) => {
    event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Đóng menu dropdown nếu người dùng click bên ngoài
  window.addEventListener("click", (event) => {
    if (
      !avatarIcon.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
    }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const feedbackContainer = document.getElementById("feedback-container");
  const feedbackOverlay = document.getElementById("feedback-overlay");
  const openFeedbackButton = document.getElementById("open-feedback");
  const closeFeedbackButton = document.getElementById("close-feedback");

  // Ẩn khung feedback và overlay khi trang web được tải
  feedbackContainer.style.display = "none";
  feedbackOverlay.style.display = "none";

  // Hiển thị khung feedback và overlay khi nhấn nút mở
  openFeedbackButton.addEventListener("click", function () {
    feedbackContainer.style.display = "block";
    feedbackOverlay.style.display = "block";
  });

  // Ẩn khung feedback và overlay khi nhấn vào hình ảnh đóng
  closeFeedbackButton.addEventListener("click", function () {
    feedbackContainer.style.display = "none";
    feedbackOverlay.style.display = "none";
  });

  // Ẩn khung feedback và overlay khi nhấn vào overlay
  feedbackOverlay.addEventListener("click", function () {
    feedbackContainer.style.display = "none";
    feedbackOverlay.style.display = "none";
  });

  // Xử lý sự kiện khi người dùng chọn một tùy chọn feedback
  const feedbackOptions = document.querySelectorAll(".feedback-option");
  feedbackOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      console.log("Người dùng đã chọn:", this.querySelector("h3").textContent);
      feedbackContainer.style.display = "none";
      feedbackOverlay.style.display = "none";
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const appsIcon = document.getElementById("appsIcon");
  const appsMenu = document.getElementById("appsMenu");

  appsIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    appsMenu.classList.toggle("show");
  });

  // Đóng menu ứng dụng nếu người dùng click bên ngoài
  window.addEventListener("click", (event) => {
    if (!appsIcon.contains(event.target) && !appsMenu.contains(event.target)) {
      appsMenu.classList.remove("show");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const helpIcon = document.getElementById("helpIcon");
  const helpMenu = document.getElementById("helpMenu");
  const helpTooltipWrapper = helpIcon.closest(".help-tooltip-wrapper");

  helpIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (helpMenu.style.display === "block") {
      helpMenu.style.display = "none";
      helpTooltipWrapper.classList.remove("menu-open");
    } else {
      helpMenu.style.display = "block";
      helpTooltipWrapper.classList.add("menu-open");
    }
  });

  // Đóng menu help nếu người dùng click bên ngoài
  window.addEventListener("click", (event) => {
    if (!helpIcon.contains(event.target) && !helpMenu.contains(event.target)) {
      helpMenu.style.display = "none";
      helpTooltipWrapper.classList.remove("menu-open");
    }
  });

  // Ngăn chặn sự kiện click từ việc lan truyền khi nhấp vào menu
  helpMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});
