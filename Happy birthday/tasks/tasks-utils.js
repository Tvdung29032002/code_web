import { updateCalendar } from "./tasks-calendar.js";
import {
  addTask,
  currentDate,
  deleteTask,
  fetchTasks,
  tasks,
  updateTask,
} from "./tasks-script.js";

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createTaskElement(task) {
  const taskElement = document.createElement("div");
  taskElement.classList.add("task");

  // Kiểm tra nếu là nhiệm vụ cố định "Tiếng Anh - Từ vựng" hoặc "Tiếng Anh - Minigame"
  if (
    task.isFixed &&
    task.type === "english" &&
    (task.activity === "vocabulary" || task.activity === "game")
  ) {
    taskElement.classList.add("fixed-task");
  }

  taskElement.textContent = task.name;
  taskElement.dataset.id = task.id;
  taskElement.dataset.type = task.type;
  taskElement.dataset.activity = task.activity;

  if (new Date(task.date) < new Date()) {
    taskElement.classList.add(task.completed ? "completed" : "missed");
  }

  taskElement.addEventListener("click", (e) => {
    e.stopPropagation();
    if (
      !task.isFixed ||
      task.type !== "english" ||
      (task.activity !== "vocabulary" && task.activity !== "game")
    ) {
      editTask(task, e.target.closest(".day"));
    } else {
      console.log(
        "Không thể chỉnh sửa nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame"
      );
    }
  });

  return taskElement;
}

function showTaskForm(dayElement, dateString) {
  let form = dayElement.querySelector(".task-form");

  if (!form) {
    form = document.createElement("form");
    form.classList.add("task-form");
    form.innerHTML = `
        <select id="taskType" required>
          <option value="">Chọn loại học tập</option>
          <option value="english">Tiếng Anh</option>
          <option value="chinese">Tiếng Trung</option>
        </select>
        
        <select id="activityType" required>
          <option value="">Chọn hoạt động</option>
          <option value="vocabulary">Từ vựng</option>
          <option value="game">Minigame</option>
        </select>
        
        <div class="task-form-actions">
          <button type="button" class="task-form-btn task-form-btn-cancel">Hủy</button>
          <button type="submit" class="task-form-btn task-form-btn-save">Lưu</button>
        </div>
      `;

    form.addEventListener("submit", handleFormSubmit);
    form
      .querySelector(".task-form-btn-cancel")
      .addEventListener("click", () => hideTaskForm(form));

    dayElement.appendChild(form);
  }

  form.style.display = "block";
}

function hideTaskForm(form) {
  form.style.display = "none";
  form.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const taskType = form.querySelector("#taskType").value;
  const activityType = form.querySelector("#activityType").value;
  const date = form.closest(".day").dataset.date;

  const newTask = {
    name: `${taskType === "english" ? "Tiếng Anh" : "Tiếng Trung"} - ${
      activityType === "vocabulary" ? "Từ vựng" : "Minigame"
    }`,
    type: taskType,
    activity: activityType,
    date: date,
    completed: false,
  };

  if (await isTaskDuplicate(newTask)) {
    alert(
      "Nhiệm vụ này đã tồn tại trong ngày này. Vui lòng chọn nhiệm vụ khác."
    );
    return;
  }

  await addTask(newTask);
  hideTaskForm(form);
  updateCalendar(); // Thêm dòng này để cập nhật lịch sau khi thêm nhiệm vụ mới
}

async function isTaskDuplicate(task) {
  const existingTasks = tasks.filter(
    (t) =>
      t.date === task.date &&
      t.type === task.type &&
      t.activity === task.activity
  );
  return existingTasks.length > 0;
}

function editTask(task, dayElement) {
  if (task.isFixed) {
    alert("Không thể chỉnh sửa nhiệm vụ cố định.");
    return;
  }

  const existingForm = dayElement.querySelector(".task-form");
  if (existingForm) {
    existingForm.remove();
  }

  const form = document.createElement("form");
  form.classList.add("task-form");
  form.innerHTML = `
      <select id="taskType" required>
        <option value="">Chọn loại học tập</option>
        <option value="english" ${
          task.type === "english" ? "selected" : ""
        }>Tiếng Anh</option>
        <option value="chinese" ${
          task.type === "chinese" ? "selected" : ""
        }>Tiếng Trung</option>
      </select>
      
      <select id="activityType" required>
        <option value="">Chọn hoạt động</option>
        <option value="vocabulary" ${
          task.activity === "vocabulary" ? "selected" : ""
        }>Từ vựng</option>
        <option value="game" ${
          task.activity === "game" ? "selected" : ""
        }>Minigame</option>
      </select>
      
      <div class="task-form-actions">
        <button type="button" class="task-form-btn task-form-btn-delete">Xóa</button>
        <button type="button" class="task-form-btn task-form-btn-cancel">Hủy</button>
        <button type="submit" class="task-form-btn task-form-btn-save">Cập nhật</button>
      </div>
    `;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updatedTask = {
      ...task,
      type: form.querySelector("#taskType").value,
      activity: form.querySelector("#activityType").value,
      name: `${
        form.querySelector("#taskType").value === "english"
          ? "Tiếng Anh"
          : "Tiếng Trung"
      } - ${
        form.querySelector("#activityType").value === "vocabulary"
          ? "Từ vựng"
          : "Minigame"
      }`,
    };
    await updateTask(updatedTask);
    form.remove();

    // Cập nhật giao diện ngay lập tức
    const taskElement = dayElement.querySelector(`[data-id="${task.id}"]`);
    if (taskElement) {
      taskElement.textContent = updatedTask.name;
      taskElement.dataset.type = updatedTask.type;
      taskElement.dataset.activity = updatedTask.activity;
    }

    updateCalendar();
  });

  form.querySelector(".task-form-btn-cancel").addEventListener("click", () => {
    form.remove();
  });

  form
    .querySelector(".task-form-btn-delete")
    .addEventListener("click", async () => {
      if (confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
        await deleteTask(task.id);
        form.remove();

        // Xóa nhiệm vụ khỏi giao diện ngay lập tức
        const taskElement = dayElement.querySelector(`[data-id="${task.id}"]`);
        if (taskElement) {
          taskElement.remove();
        }

        updateCalendar();
      }
    });

  dayElement.appendChild(form);
}

function toggleTaskCompletion(task) {
  task.completed = !task.completed;
  updateTask(task);
  updateCalendar(); // Thêm dòng này để cập nhật lịch sau khi thay đổi trạng thái nhiệm vụ
}

function searchTasks() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchTerm) ||
      task.type.toLowerCase().includes(searchTerm) ||
      task.activity.toLowerCase().includes(searchTerm)
  );

  displaySearchResults(filteredTasks);
}

function displaySearchResults(results) {
  const resultsContainer = document.getElementById("searchResultsContainer");
  const resultsList = document.getElementById("searchResultsList");
  resultsList.innerHTML = "";

  if (results.length === 0) {
    resultsList.innerHTML =
      "<li class='no-results'>Không tìm thấy kết quả nào</li>";
  } else {
    results.forEach((task) => {
      const taskElement = document.createElement("li");
      taskElement.classList.add("search-result-item");
      taskElement.innerHTML = `
          <div class="task-name">${task.name}</div>
          <div class="task-details">
            <span class="task-type ${task.type}">${
        task.type === "english" ? "Tiếng Anh" : "Tiếng Trung"
      }</span>
            <span class="task-activity ${task.activity}">${
        task.activity === "vocabulary" ? "Từ vựng" : "Minigame"
      }</span>
            <span class="task-date">${task.date}</span>
            <span class="task-status ${
              task.completed ? "completed" : "pending"
            }">${task.completed ? "Hoàn thành" : "Chưa hoàn thành"}</span>
          </div>
        `;
      resultsList.appendChild(taskElement);
    });
  }

  resultsContainer.classList.remove("hidden");
}

function hideSearchResults() {
  const resultsContainer = document.getElementById("searchResultsContainer");
  resultsContainer.classList.add("hidden");
}

function updateLearningStatistics(period = "all") {
  const ctx = document.getElementById("progressChart").getContext("2d");
  let relevantTasks;

  if (period === "all") {
    relevantTasks = tasks;
  } else {
    const [year, month] = period.split("-");
    relevantTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return (
        taskDate.getFullYear() === parseInt(year) &&
        taskDate.getMonth() === parseInt(month) - 1
      );
    });
  }

  const completedTasks = relevantTasks.filter((task) => task.completed).length;
  const totalTasks = relevantTasks.length;
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Hoàn thành", "Chưa hoàn thành"],
      datasets: [
        {
          data: [completedTasks, totalTasks - completedTasks],
          backgroundColor: [
            "rgba(75, 192, 192, 0.8)",
            "rgba(255, 99, 132, 0.8)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: `Tỉ lệ hoàn thành: ${completionRate.toFixed(1)}%`,
        },
      },
    },
  });
}

// Thêm hàm mới để khởi tạo dropdown năm
function initializeYearDropdown() {
  const yearSelect = document.getElementById("statisticsYear");
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 5; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const exportCalendarBtn = document.getElementById("exportCalendar");
  const searchButton = document.getElementById("searchButton");
  const searchInput = document.getElementById("searchInput");
  const closeSearchResultsBtn = document.getElementById("closeSearchResults");
  const backToHomeBtn = document.getElementById("backToHome");
  const statisticsMonthly = document.getElementById("statisticsMonthly");
  const statisticsAll = document.getElementById("statisticsAll");
  const statisticsMonth = document.getElementById("statisticsMonth");
  const statisticsYear = document.getElementById("statisticsYear");

  initializeYearDropdown();

  statisticsMonthly.addEventListener("click", () => {
    const selectedMonth = statisticsMonth.value;
    const selectedYear = statisticsYear.value;
    updateLearningStatistics(`${selectedYear}-${selectedMonth}`);
  });

  statisticsAll.addEventListener("click", () => {
    updateLearningStatistics("all");
  });

  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });

  exportCalendarBtn.addEventListener("click", exportCalendar);
  searchButton.addEventListener("click", searchTasks);
  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      searchTasks();
    }
  });
  closeSearchResultsBtn.addEventListener("click", hideSearchResults);
  backToHomeBtn.addEventListener("click", function () {
    window.location.href = "../index.html";
  });

  // Initialize the calendar
  fetchTasks().then(() => {
    updateCalendar();
    updateLearningStatistics("all");
  });

  // Add event listener for task completion toggle
  calendar.addEventListener("click", (e) => {
    if (e.target.classList.contains("task")) {
      const taskDate = e.target.closest(".day").dataset.date;
      const taskName = e.target.textContent;
      const task = tasks.find(
        (t) => t.date === taskDate && t.name === taskName
      );
      if (task) {
        toggleTaskCompletion(task);
      }
    }
  });
});

// Export functions to be used in other files
function exportCalendar() {
  const fileName = `English_Chinese_Learning_Schedule_${formatDate(
    new Date()
  )}.csv`;
  let csvContent = "Ngày,Loại học tập,Hoạt động,Tên nhiệm vụ,Trạng thái\n";

  tasks
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((task) => {
      const status = task.completed ? "Hoàn thành" : "Chưa hoàn thành";
      csvContent += `${task.date},${task.type},${task.activity},${task.name},${status}\n`;
    });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showExportNotification();
}

function showExportNotification() {
  const notification = document.createElement("div");
  notification.textContent = "Lịch đã được xuất thành công!";
  notification.classList.add("export-notification");
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }, 100);
}

export {
  createTaskElement,
  displaySearchResults,
  editTask,
  exportCalendar,
  formatDate,
  handleFormSubmit,
  hideSearchResults,
  hideTaskForm,
  isTaskDuplicate,
  searchTasks,
  showTaskForm,
  toggleTaskCompletion,
  updateLearningStatistics,
};
