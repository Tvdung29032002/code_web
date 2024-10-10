// main.js

import modalHandler from "./assign-modal-handler.js";
import taskManager from "./assign-task-manager.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded");

  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Vui lòng đăng nhập để sử dụng tính năng này.");
    window.location.href = "/login.html";
    return;
  }

  const backToHomeButton = document.getElementById("backToHome");
  backToHomeButton.addEventListener("click", function () {
    window.location.href = "../index.html";
  });

  modalHandler.init();

  taskManager.loadAssignedTasks(userId);
  taskManager.loadTaskOverview(userId);

  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm === "") {
      taskManager.loadAssignedTasks(userId);
    } else {
      taskManager.searchTasks(userId, searchTerm);
    }
  }

  // Thêm xử lý cho modal chỉnh sửa
  const editTaskModal = document.getElementById("editTaskModal");
  const closeEditModal = editTaskModal.querySelector(".close");
  closeEditModal.addEventListener("click", () => {
    editTaskModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == editTaskModal) {
      editTaskModal.style.display = "none";
    }
  });

  // Thêm xử lý cho form chỉnh sửa
  const editTaskForm = document.getElementById("editTaskForm");
  editTaskForm.addEventListener("submit", (e) => {
    const taskId = document.getElementById("editTaskId").value;
    modalHandler.handleEditFormSubmit(e, taskId);
  });

  // Thêm event listener cho custom event 'taskUpdated'
  window.addEventListener("taskUpdated", (event) => {
    taskManager.loadAssignedTasks(event.detail.userId);
  });

  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", function () {
    const userId = localStorage.getItem("userId");
    const activeCard = document.querySelector(".task-card.active");
    const filter = activeCard ? activeCard.dataset.filter : "all";
    taskManager.loadAssignedTasks(userId, filter, this.value);
  });

  const taskCards = document.querySelectorAll(".task-card");
  taskCards.forEach((card) => {
    card.addEventListener("click", function () {
      const filter = this.dataset.filter;
      const sortBy = sortSelect.value;
      taskManager.loadAssignedTasks(userId, filter, sortBy);

      // Thêm class active cho card được chọn và xóa khỏi các card khác
      taskCards.forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
    });
  });

  const allTasksCard = document.querySelector('.task-card[data-filter="all"]');
  if (allTasksCard) {
    allTasksCard.classList.add("active");
  }
});
