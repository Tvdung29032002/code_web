document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded");

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Vui lòng đăng nhập để sử dụng tính năng này.");
    window.location.href = "/login.html"; // Chuyển hướng về trang đăng nhập
    return;
  }

  const assignTaskForm = document.getElementById("assignTaskForm");
  const taskList = document.getElementById("taskList");
  const backToHomeButton = document.getElementById("backToHome");

  // Thêm xử lý sự kiện cho nút "Trang chủ"
  backToHomeButton.addEventListener("click", function () {
    window.location.href = "../index.html";
  });

  assignTaskForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      userId: userId,
      taskName: document.getElementById("taskName").value,
      taskDescription: document.getElementById("taskDescription").value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value,
      priority: document.querySelector('input[name="priority"]:checked').value,
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
        loadAssignedTasks();
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      let errorMessage = "Đã xảy ra lỗi khi giao nhiệm vụ";
      if (error instanceof Response) {
        errorMessage += `: ${error.status} ${error.statusText}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      alert(errorMessage);
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
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="${task.completed ? "completed" : ""}">${
        task.task_name
      } - Ưu tiên: ${task.priority}</span>
        <input type="checkbox" class="task-checkbox" data-task-id="${
          task.id
        }" ${task.completed ? "checked" : ""}>
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
            this.closest("li")
              .querySelector("span")
              .classList.toggle("completed", completed);
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
});
