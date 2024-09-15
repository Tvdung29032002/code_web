document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded");

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Vui lòng đăng nhập để sử dụng tính năng này.");
    window.location.href = "/login.html"; // Chuyển hướng về trang đăng nhập
    return;
  }

  const assignTaskForm = document.getElementById("taskForm");
  const taskList = document.getElementById("taskList");
  const backToHomeButton = document.getElementById("backToHome");

  // Thêm xử lý sự kiện cho nút "Trang chủ"
  backToHomeButton.addEventListener("click", function () {
    window.location.href = "../index.html";
  });

  const priorityButtons = document.querySelectorAll(".priority-btn");
  let selectedPriority = null;

  priorityButtons.forEach((button) => {
    button.addEventListener("click", function () {
      priorityButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      selectedPriority = this.dataset.priority;
    });
  });

  assignTaskForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!selectedPriority) {
      alert("Vui lòng chọn mức độ ưu tiên");
      return;
    }

    const startDate = document.getElementById("startDate").value;
    const startTime = document.getElementById("startTime").value;
    const endDate = document.getElementById("endDate").value;
    const endTime = document.getElementById("endTime").value;

    const formData = {
      userId: userId,
      taskName: document.getElementById("taskName").value,
      taskDescription: document.getElementById("taskDescription").value,
      startDateTime: `${startDate}T${startTime}`,
      endDateTime: `${endDate}T${endTime}`,
      priority: selectedPriority,
    };

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/assign-task",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        assignTaskForm.reset();
        priorityButtons.forEach((btn) => btn.classList.remove("active"));
        selectedPriority = null;
        taskModal.style.display = "none";
        loadAssignedTasks();
        loadTaskOverview();
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã xảy ra lỗi khi giao nhiệm vụ: " + error.message);
    }
  });

  async function loadAssignedTasks() {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/assigned-tasks/${userId}`
      );
      const result = await response.json();

      if (result.success) {
        displayAssignedTasks(result.tasks);
      } else {
        console.error("Lỗi khi tải danh sách nhiệm vụ:", result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  }

  function displayAssignedTasks(tasks) {
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      const startDateTime = new Date(task.start_date);
      const endDateTime = new Date(task.end_date);
      const formattedStartDate = startDateTime.toLocaleDateString("vi-VN");
      const formattedStartTime = startDateTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const formattedEndDate = endDateTime.toLocaleDateString("vi-VN");
      const formattedEndTime = endDateTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;
      li.innerHTML = `
        <div class="task-header">
          <h3 class="task-name">${task.task_name}</h3>
          <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
        <div class="task-body">
          <p class="task-description">${task.task_description}</p>
          <div class="task-time">
            <span class="task-start-time">Bắt đầu: ${formattedStartDate} ${formattedStartTime}</span>
            <span class="task-end-time">Kết thúc: ${formattedEndDate} ${formattedEndTime}</span>
          </div>
        </div>
        <div class="task-footer">
          <label class="task-status">
            <input type="checkbox" class="task-checkbox" data-task-id="${
              task.id
            }" ${task.completed ? "checked" : ""}>
            <span class="checkmark"></span>
            ${task.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
          </label>
        </div>
      `;
      taskList.appendChild(li);
    });

    // Thêm sự kiện cho các checkbox
    const checkboxes = document.querySelectorAll(".task-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", async function () {
        const taskId = this.dataset.taskId;
        const completed = this.checked;

        try {
          const response = await fetch(
            `http://192.168.0.103:3000/api/assigned-tasks/${taskId}/complete`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ completed }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.success) {
            this.closest(".task-item").classList.toggle("completed", completed);
          } else {
            alert("Lỗi: " + result.message);
            this.checked = !completed; // Revert checkbox state if update failed
          }
        } catch (error) {
          console.error("Lỗi:", error);
          alert("Đã xảy ra lỗi khi cập nhật trạng thái nhiệm vụ");
          this.checked = !completed; // Revert checkbox state if update failed
        }
      });
    });
  }

  // Load danh sách nhiệm vụ khi trang được tải
  loadAssignedTasks();

  // Thêm hàm mới để lấy và hiển thị tổng quan nhiệm vụ
  async function loadTaskOverview() {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/task-overview/${userId}`
      );
      const result = await response.json();

      if (result.success) {
        displayTaskOverview(result.overview);
      } else {
        console.error("Lỗi khi tải tổng quan nhiệm vụ:", result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  }

  function displayTaskOverview(overview) {
    document.querySelector(".task-card:nth-child(1) .task-count").textContent =
      overview.total;
    document.querySelector(".task-card:nth-child(2) .task-count").textContent =
      overview.inProgress;
    document.querySelector(".task-card:nth-child(3) .task-count").textContent =
      overview.completed;
    document.querySelector(".task-card:nth-child(4) .task-count").textContent =
      overview.overdue;
  }

  // Gọi hàm loadTaskOverview khi trang được tải
  loadTaskOverview();

  const addTaskButton = document.getElementById("addTaskButton");
  const taskModal = document.getElementById("taskModal");

  addTaskButton.addEventListener("click", function () {
    taskModal.style.display = "block";
  });

  // Thêm sự kiện đóng modal
  const closeModal = document.getElementsByClassName("close")[0];
  closeModal.addEventListener("click", function () {
    taskModal.style.display = "none";
  });

  // Đóng modal khi click bên ngoài
  window.addEventListener("click", function (event) {
    if (event.target == taskModal) {
      taskModal.style.display = "none";
    }
  });

  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  async function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm === "") {
      loadAssignedTasks(); // Nếu ô tìm kiếm trống, load lại tất cả nhiệm vụ
      return;
    }

    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/assigned-tasks/search/${userId}?searchTerm=${encodeURIComponent(
          searchTerm
        )}`
      );
      const result = await response.json();

      if (result.success) {
        displayAssignedTasks(result.tasks);
      } else {
        console.error("Lỗi khi tìm kiếm nhiệm vụ:", result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  }
});
