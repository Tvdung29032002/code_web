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
