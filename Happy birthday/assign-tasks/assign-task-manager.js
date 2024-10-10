import modalHandler from "./assign-modal-handler.js";

const taskManager = {
  async loadAssignedTasks(userId, filter = "all", sortBy = "default") {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/assigned-tasks/${userId}?filter=${filter}`
      );
      const result = await response.json();

      if (result.success) {
        const sortedTasks = this.sortTasks(result.tasks, sortBy);
        this.displayAssignedTasks(sortedTasks);
      } else {
        console.error("Lỗi khi tải danh sách nhiệm vụ:", result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  },

  sortTasks(tasks, sortBy) {
    return tasks.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.task_name.localeCompare(b.task_name);
        case "priority":
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "dueDate":
          return new Date(a.end_date) - new Date(b.end_date);
        default:
          return 0;
      }
    });
  },

  displayAssignedTasks(tasks) {
    const taskList = document.getElementById("taskList");
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

      let statusText = "";
      let statusClass = "";
      if (task.completed) {
        if (task.completion_status === "overdue") {
          statusText = "Hoàn thành trễ";
          statusClass = "task-overdue";
        } else {
          statusText = "Hoàn thành đúng hạn";
          statusClass = "task-on-time";
        }
      } else if (task.completion_status === "overdue") {
        statusText = "Quá hạn";
        statusClass = "task-overdue";
      }

      const completedAtText = task.formatted_completed_at
        ? `<span class="task-completed-at ${statusClass}">${statusText} lúc: ${task.formatted_completed_at}</span>`
        : "";

      const taskItem = document.createElement("li");
      taskItem.className = `task-item ${
        task.completed ? "completed" : ""
      } ${statusClass}`;
      taskItem.dataset.taskId = task.id;

      taskItem.innerHTML = `
          <div class="task-header">
            <input type="checkbox" class="task-checkbox" data-task-id="${
              task.id
            }" ${task.completed ? "checked" : ""}>
            <h3>${task.task_name}</h3>
            <span class="task-priority ${task.priority}">${task.priority}</span>
          </div>
          <p class="task-description">${task.task_description}</p>
          <div class="task-dates">
            <span>Bắt đầu: ${formattedStartDate} ${formattedStartTime}</span>
            <span>Kết thúc: ${formattedEndDate} ${formattedEndTime}</span>
          </div>
          <div class="task-creator">Người tạo: ${task.creator_name}</div>
          ${completedAtText}
        `;

      const taskFooter = document.createElement("div");
      taskFooter.className = "task-footer";

      const editButton = document.createElement("button");
      editButton.className = "edit-task-btn";
      editButton.textContent = "Chỉnh sửa";
      editButton.dataset.taskId = task.id;

      if (task.completed) {
        editButton.disabled = true;
        editButton.title = "Không thể chỉnh sửa nhiệm vụ đã hoàn thành";
      } else {
        editButton.addEventListener("click", () =>
          this.handleEditButtonClick(task.id)
        );
      }

      taskFooter.appendChild(editButton);
      taskItem.appendChild(taskFooter);
      taskList.appendChild(taskItem);
    });

    this.addCheckboxListeners();
    this.addEditButtonListeners();
  },

  handleEditButtonClick(taskId) {
    const task = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (task.classList.contains("completed")) {
      alert("Không thể chỉnh sửa nhiệm vụ đã hoàn thành");
    } else {
      modalHandler.handleEditTask(taskId);
    }
  },

  addCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".task-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", async function (event) {
        const taskId = this.dataset.taskId;
        const completed = this.checked;
        const taskItem = this.closest(".task-item");

        // Kiểm tra xem nhiệm vụ đã hoàn thành chưa
        if (taskItem.classList.contains("completed") && !completed) {
          // Nếu nhiệm vụ đã hoàn thành và người dùng cố gắng bỏ chọn
          event.preventDefault(); // Ngăn chặn thay đổi trạng thái checkbox
          this.checked = true; // Đảm bảo checkbox vẫn được chọn
          alert("Không thể bỏ chọn nhiệm vụ đã hoàn thành");
          return;
        }

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
            taskItem.classList.toggle("completed", completed);
            const editButton = taskItem.querySelector(".edit-task-btn");
            if (editButton) {
              editButton.disabled = completed;
              editButton.title = completed
                ? "Không thể chỉnh sửa nhiệm vụ đã hoàn thành"
                : "";
            }

            // ... (phần code còn lại)
          } else {
            alert("Lỗi: " + result.message);
            this.checked = !completed;
          }
        } catch (error) {
          console.error("Lỗi:", error);
          alert("Đã xảy ra lỗi khi cập nhật trạng thái nhiệm vụ");
          this.checked = !completed;
        }
      });
    });
  },

  addEditButtonListeners() {
    const editButtons = document.querySelectorAll(".edit-task-btn");
    editButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const taskId = e.target.dataset.taskId;
        modalHandler.handleEditTask(taskId);
      });
    });
  },

  async loadTaskOverview(userId) {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/task-overview/${userId}`
      );
      const result = await response.json();

      if (result.success) {
        this.displayTaskOverview(result.overview);
      } else {
        console.error("Lỗi khi tải tổng quan nhiệm vụ:", result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  },

  displayTaskOverview(overview) {
    document.querySelector(".task-card:nth-child(1) .task-count").textContent =
      overview.total;
    document.querySelector(".task-card:nth-child(2) .task-count").textContent =
      overview.inProgress;
    document.querySelector(".task-card:nth-child(3) .task-count").textContent =
      overview.completed;
    document.querySelector(".task-card:nth-child(4) .task-count").textContent =
      overview.overdue;
  },

  async searchTasks(userId, searchTerm) {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/assigned-tasks/search/${userId}?searchTerm=${searchTerm}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        this.displayAssignedTasks(data.tasks);
      } else {
        console.error("Lỗi khi tìm kiếm nhiệm vụ:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm nhiệm vụ:", error);
    }
  },
};

export default taskManager;
