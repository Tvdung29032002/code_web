import taskManager from "./assign-task-manager.js";

// modalHandler.js

const modalHandler = {
  init() {
    this.addTaskButton = document.getElementById("addTaskButton");
    this.taskModal = document.getElementById("taskModal");
    this.closeModal = document.getElementsByClassName("close")[0];
    this.assignTaskForm = document.getElementById("taskForm");
    this.priorityButtons = document.querySelectorAll(".priority-btn");
    this.selectedPriority = null;

    this.attachEventListeners();
  },

  attachEventListeners() {
    if (this.addTaskButton) {
      this.addTaskButton.addEventListener("click", () => this.openModal());
    } else {
      console.error("Không tìm thấy phần tử có ID 'addTaskButton'");
    }

    this.closeModal.addEventListener("click", () => this.closeModalHandler());

    window.addEventListener("click", (event) => {
      if (event.target == this.taskModal) {
        this.closeModalHandler();
      }
    });

    this.priorityButtons.forEach((button) => {
      button.addEventListener("click", (e) => this.handlePrioritySelection(e));
    });

    this.assignTaskForm.addEventListener("submit", (e) =>
      this.handleFormSubmit(e)
    );
  },

  openModal() {
    this.taskModal.style.display = "block";
  },

  closeModalHandler() {
    this.taskModal.style.display = "none";
  },

  handlePrioritySelection(e) {
    this.priorityButtons.forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
    this.selectedPriority = e.target.dataset.priority;
  },

  async handleFormSubmit(e) {
    e.preventDefault();

    if (!this.selectedPriority) {
      alert("Vui lòng chọn mức độ ưu tiên");
      return;
    }

    const startDate = document.getElementById("startDate").value;
    const startTime = document.getElementById("startTime").value;
    const endDate = document.getElementById("endDate").value;
    const endTime = document.getElementById("endTime").value;

    const formData = {
      userId: localStorage.getItem("userId"),
      taskName: document.getElementById("taskName").value,
      taskDescription: document.getElementById("taskDescription").value,
      startDateTime: `${startDate}T${startTime}`,
      endDateTime: `${endDate}T${endTime}`,
      priority: this.selectedPriority,
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
        this.resetForm();
        this.closeModalHandler();
        // You might want to trigger a reload of tasks here
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã xảy ra lỗi khi giao nhiệm vụ: " + error.message);
    }
  },

  resetForm() {
    this.assignTaskForm.reset();
    this.priorityButtons.forEach((btn) => btn.classList.remove("active"));
    this.selectedPriority = null;
  },

  handleEditTask(taskId) {
    fetch(`http://192.168.0.103:3000/api/assigned-tasks/detail/${taskId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          if (data.task.completed) {
            alert("Không thể chỉnh sửa nhiệm vụ đã hoàn thành");
            return;
          }

          // Điền thông tin vào form chỉnh sửa
          document.getElementById("editTaskId").value = data.task.id;
          document.getElementById("editTaskName").value = data.task.task_name;
          document.getElementById("editTaskDescription").value =
            data.task.task_description;

          const startDate = new Date(data.task.start_date);
          document.getElementById("editStartDate").value = startDate
            .toISOString()
            .split("T")[0];
          document.getElementById("editStartTime").value = startDate
            .toTimeString()
            .slice(0, 5);

          const endDate = new Date(data.task.end_date);
          document.getElementById("editEndDate").value = endDate
            .toISOString()
            .split("T")[0];
          document.getElementById("editEndTime").value = endDate
            .toTimeString()
            .slice(0, 5);

          // Hiển thị thông tin về thời gian cập nhật
          const updatedAtInfo = document.getElementById("updatedAtInfo");
          if (updatedAtInfo) {
            updatedAtInfo.textContent = `Cập nhật lần cuối: ${data.task.formatted_updated_at}`;
          }

          // Đặt lại trạng thái nút ưu tiên
          this.priorityButtons.forEach((btn) => {
            btn.classList.toggle(
              "active",
              btn.dataset.priority === data.task.priority
            );
          });
          this.selectedPriority = data.task.priority;

          // Hiển thị modal chỉnh sửa
          document.getElementById("editTaskModal").style.display = "block";
        } else {
          throw new Error(data.message || "Không thể lấy thông tin nhiệm vụ");
        }
      })
      .catch((error) => {
        console.error("Lỗi:", error);
        alert("Đã xảy ra lỗi khi lấy thông tin nhiệm vụ: " + error.message);
      });
  },

  async handleEditFormSubmit(e, taskId) {
    e.preventDefault();

    if (!this.selectedPriority) {
      alert("Vui lòng chọn mức độ ưu tiên");
      return;
    }

    const startDate = document.getElementById("editStartDate").value;
    const startTime = document.getElementById("editStartTime").value;
    const endDate = document.getElementById("editEndDate").value;
    const endTime = document.getElementById("editEndTime").value;

    const formData = {
      taskName: document.getElementById("editTaskName").value,
      taskDescription: document.getElementById("editTaskDescription").value,
      startDateTime: `${startDate}T${startTime}`,
      endDateTime: `${endDate}T${endTime}`,
      priority: this.selectedPriority,
    };

    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/assigned-tasks/${taskId}`,
        {
          method: "PUT",
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
        document.getElementById("editTaskModal").style.display = "none";
        // Dispatch một custom event
        window.dispatchEvent(
          new CustomEvent("taskUpdated", {
            detail: { userId: localStorage.getItem("userId") },
          })
        );
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã xảy ra lỗi khi cập nhật nhiệm vụ: " + error.message);
    }
  },
};

export default modalHandler;
