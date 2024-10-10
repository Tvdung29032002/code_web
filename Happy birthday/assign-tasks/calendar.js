document.addEventListener("DOMContentLoaded", function () {
  const calendarDays = document.getElementById("calendarDays");
  const currentMonthElement = document.getElementById("currentMonth");
  const prevMonthButton = document.getElementById("prevMonth");
  const nextMonthButton = document.getElementById("nextMonth");

  let currentDate = new Date();
  let tasks = [];

  const modal = document.getElementById("taskModal");
  const modalDate = document.getElementById("modalDate");
  const modalTaskList = document.getElementById("modalTaskList");
  const closeModal = document.getElementsByClassName("close")[0];

  async function fetchTasks(userId, year, month) {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/assigned-tasks/${userId}?year=${year}&month=${month}`
      );
      const result = await response.json();
      if (result.success) {
        tasks = result.tasks.map((task) => ({
          ...task,
          completion_status: task.completed
            ? new Date(task.completed_at) > new Date(task.end_date)
              ? "overdue"
              : "on_time"
            : new Date() > new Date(task.end_date)
            ? "overdue"
            : "in_progress",
        }));
      } else {
        console.error("Lỗi khi tải danh sách nhiệm vụ:", result.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  }

  function showTaskDetails(tasks, day) {
    modalDate.textContent = `Nhiệm vụ ngày ${day}/${
      currentDate.getMonth() + 1
    }/${currentDate.getFullYear()}`;
    modalTaskList.innerHTML = "";

    tasks.forEach((task) => {
      const li = document.createElement("li");
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);

      const formatDateTime = (date) => {
        return date.toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const startDateTime = formatDateTime(startDate);
      const endDateTime = formatDateTime(endDate);

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
      } else {
        statusText = "Đang thực hiện";
        statusClass = "task-in-progress";
      }

      li.innerHTML = `
        <strong>${task.task_name}</strong><br>
        Mô tả: ${task.task_description}<br>
        Thời gian: ${startDateTime} - ${endDateTime}<br>
        Ưu tiên: ${task.priority}<br>
        Trạng thái: <span class="${statusClass}">${statusText}</span>
      `;
      modalTaskList.appendChild(li);
    });

    modal.style.display = "block";
  }

  closeModal.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  function renderCalendar(year, month) {
    calendarDays.innerHTML = "";
    currentMonthElement.textContent = `Tháng ${month + 1} năm ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement("div");
      calendarDays.appendChild(emptyDay);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.textContent = day;
      dayElement.classList.add("calendar-day");

      const currentDateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const dayTasks = tasks.filter((task) => {
        const taskDate = new Date(task.start_date);
        return (
          taskDate.getFullYear() === year &&
          taskDate.getMonth() === month &&
          taskDate.getDate() === day
        );
      });

      if (dayTasks.length > 0) {
        dayElement.classList.add("has-tasks");

        const completedTasks = dayTasks.filter((task) => task.completed);
        const incompleteTasks = dayTasks.filter((task) => !task.completed);

        if (completedTasks.length > 0) {
          const completedIndicator = document.createElement("div");
          completedIndicator.classList.add(
            "task-indicator",
            "completed-indicator"
          );
          completedIndicator.textContent = completedTasks.length;
          dayElement.appendChild(completedIndicator);
        }

        if (incompleteTasks.length > 0) {
          const incompleteIndicator = document.createElement("div");
          incompleteIndicator.classList.add(
            "task-indicator",
            "incomplete-indicator"
          );
          incompleteIndicator.textContent = incompleteTasks.length;
          dayElement.appendChild(incompleteIndicator);
        }

        dayElement.addEventListener("click", () =>
          showTaskDetails(dayTasks, day)
        );
      }

      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
      ) {
        dayElement.classList.add("current-day");
      }
      calendarDays.appendChild(dayElement);
    }
  }

  async function updateCalendar() {
    const userId = localStorage.getItem("userId");
    await fetchTasks(userId, currentDate.getFullYear(), currentDate.getMonth());
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  }

  prevMonthButton.addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });

  nextMonthButton.addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });

  updateCalendar();

  const backToHomeButton = document.getElementById("backToHome");
  backToHomeButton.addEventListener("click", function () {
    window.location.href = "../index.html";
  });
});
