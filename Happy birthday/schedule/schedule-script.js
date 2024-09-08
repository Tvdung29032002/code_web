document.addEventListener("DOMContentLoaded", function () {
  const calendar = document.getElementById("calendar");
  const monthYearElement = document.getElementById("monthYear");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const monthViewBtn = document.getElementById("monthView");
  const weekViewBtn = document.getElementById("weekView");
  let currentDate = new Date();
  let currentView = "month";
  let tasks = [];
  const userId = localStorage.getItem("userId");

  function saveTasks() {
    // Không cần lưu vào localStorage nữa
  }

  function createCalendar(date, view) {
    calendar.innerHTML = "";
    monthYearElement.textContent = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (view === "month") {
      createMonthView(date);
    } else {
      createWeekView(date);
    }
  }

  function createMonthView(date) {
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    // Add day labels
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayLabels.forEach((day) => {
      const dayLabel = document.createElement("div");
      dayLabel.classList.add("day-label");
      dayLabel.textContent = day;
      calendar.appendChild(dayLabel);
    });

    for (let i = 0; i < firstDay; i++) {
      calendar.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = createDayElement(
        new Date(date.getFullYear(), date.getMonth(), day)
      );
      calendar.appendChild(dayElement);
    }
  }

  function createWeekView(date) {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const dayElement = createDayElement(new Date(weekStart));
      calendar.appendChild(dayElement);
      weekStart.setDate(weekStart.getDate() + 1);
    }
  }

  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function createDayElement(date) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("day");

    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      dayElement.classList.add("today");
    }

    const dayNumber = document.createElement("div");
    dayNumber.classList.add("day-number");
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);

    const dateString = formatDate(date);
    dayElement.dataset.date = dateString;

    const dayTasks = tasks.filter((task) => task.date === dateString);

    dayTasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      dayElement.appendChild(taskElement);
    });

    dayElement.addEventListener("click", (e) => {
      if (
        !e.target.classList.contains("task") &&
        !e.target.closest(".task-form")
      ) {
        showTaskForm(dayElement, dateString);
      }
    });

    return dayElement;
  }

  function createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    taskElement.textContent = task.name;
    taskElement.dataset.id = task.id;
    taskElement.dataset.type = task.type;
    taskElement.dataset.activity = task.activity;

    if (task.isFixed) {
      taskElement.classList.add("fixed-task");
    }

    if (new Date(task.date) < new Date()) {
      taskElement.classList.add(task.completed ? "completed" : "missed");
    }

    taskElement.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!task.isFixed) {
        editTask(task, e.target.closest(".day"));
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

  function setupFormColorChange(form) {
    const taskTypeSelect = form.querySelector("#taskType");
    const activityTypeSelect = form.querySelector("#activityType");

    const updateFormColor = () => {
      const taskType = taskTypeSelect.value;
      const activityType = activityTypeSelect.value;

      form.style.backgroundColor =
        taskType === "english"
          ? "var(--english-color)"
          : "var(--chinese-color)";
      form.style.color = "white";
      form.style.borderLeft =
        activityType === "vocabulary"
          ? "4px solid var(--vocabulary-color)"
          : activityType === "game"
          ? "4px solid var(--game-color)"
          : "none";
    };

    taskTypeSelect.addEventListener("change", updateFormColor);
    activityTypeSelect.addEventListener("change", updateFormColor);
  }

  function hideTaskForm(form) {
    form.style.display = "none";
    // Reset form
    form.reset();
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
      };
      await updateTask(updatedTask);
      form.remove();
      updateCalendar();
    });

    form
      .querySelector(".task-form-btn-cancel")
      .addEventListener("click", () => {
        form.remove();
      });

    form
      .querySelector(".task-form-btn-delete")
      .addEventListener("click", async () => {
        if (confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
          await deleteTask(task.id);
          form.remove();
          updateCalendar();
        }
      });

    dayElement.appendChild(form);
  }

  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });

  monthViewBtn.addEventListener("click", () => {
    currentView = "month";
    monthViewBtn.classList.add("active");
    weekViewBtn.classList.remove("active");
    updateCalendar();
  });

  weekViewBtn.addEventListener("click", () => {
    currentView = "week";
    weekViewBtn.classList.add("active");
    monthViewBtn.classList.remove("active");
    updateCalendar();
  });

  function updateCalendar() {
    createCalendar(currentDate, currentView);
  }

  function toggleTaskCompletion(task) {
    task.completed = !task.completed;
    updateTask(task);
  }

  // Initialize the calendar
  fetchTasks().then(() => {
    updateCalendar();
    updateLearningStatistics();
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

  // Thêm vào cuối file
  function searchTasks() {
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const filteredTasks = tasks.filter(
      (task) =>
        task.name.toLowerCase().includes(searchTerm) ||
        task.type.toLowerCase().includes(searchTerm) ||
        task.activity.toLowerCase().includes(searchTerm)
    );

    // Hiển thị kết quả tìm kiếm
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

  // Thêm hàm này để ẩn kết quả tìm kiếm
  function hideSearchResults() {
    const resultsContainer = document.getElementById("searchResultsContainer");
    resultsContainer.classList.add("hidden");
  }

  const closeButton = document.getElementById("closeSearchResults");
  if (closeButton) {
    closeButton.addEventListener("click", hideSearchResults);
  }

  document
    .getElementById("searchButton")
    .addEventListener("click", searchTasks);

  document
    .getElementById("searchInput")
    .addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        searchTasks();
      }
    });

  // Thêm vào cuối file
  function exportCalendar() {
    let calendarData = "English & Chinese Learning Schedule\n\n";
    tasks.forEach((task) => {
      calendarData += `${task.date} - ${task.name} (${task.type})\n`;
    });

    const blob = new Blob([calendarData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "English & Chinese Learning Schedule.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  document
    .getElementById("exportCalendar")
    .addEventListener("click", exportCalendar);

  // Thêm đoạn mã sau vào cuối file
  document.getElementById("backToHome").addEventListener("click", function () {
    window.location.href = "../index.html";
  });

  async function fetchTasks() {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/tasks/${userId}`
      );
      const data = await response.json();
      if (data.success) {
        tasks = data.tasks.map((task) => ({
          ...task,
          date: formatDate(task.date),
        }));
        console.log("Nhiệm vụ đã được tải:", tasks);
        await checkAndAddFixedTasks();
        await checkEnglishGameCompletion();
        await checkEnglishVocabularyCompletion(); // Thêm dòng này
      } else {
        console.error("Lỗi khi lấy nhiệm vụ:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi lấy nhiệm vụ:", error);
    }
  }

  async function checkAndAddFixedTasks() {
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const fixedTasks = [
      { name: "Tiếng Anh - Từ vựng", type: "english", activity: "vocabulary" },
      { name: "Tiếng Anh - Minigame", type: "english", activity: "game" },
    ];

    for (
      let day = new Date(firstDayOfMonth);
      day <= lastDayOfMonth;
      day.setDate(day.getDate() + 1)
    ) {
      const formattedDate = formatDate(day);

      for (const task of fixedTasks) {
        const taskToCheck = { ...task, date: formattedDate };
        if (!(await isTaskDuplicate(taskToCheck))) {
          await addFixedTask(taskToCheck);
        }
      }
    }
  }

  async function addFixedTask(task) {
    if (await isTaskDuplicate(task)) {
      console.log("Nhiệm vụ cố định đã tồn tại:", task);
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/tasks/fixed",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...task,
            userId,
            isFixed: true,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        console.log("Nhiệm vụ cố định đã được thêm:", task);
      } else {
        console.error("Lỗi khi thêm nhiệm vụ cố định:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi thêm nhiệm vụ cố định:", error);
    }
  }

  async function addTask(task) {
    try {
      const response = await fetch("http://192.168.0.103:3000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...task,
          userId,
          date: task.date,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        updateCalendar();
        updateLearningStatistics();
      } else {
        console.error("Lỗi khi thêm nhiệm vụ:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi thêm nhiệm vụ:", error);
    }
  }

  async function updateTask(task) {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/tasks/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        updateCalendar();
        updateLearningStatistics();
      } else {
        console.error("Lỗi khi cập nhật nhiệm vụ:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật nhiệm vụ:", error);
    }
  }

  async function deleteTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.isFixed) {
      alert("Không thể xóa nhiệm vụ cố định.");
      return;
    }

    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchTasks();
        updateCalendar();
        updateLearningStatistics();
      } else {
        console.error("Lỗi khi xóa nhiệm vụ:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi xóa nhiệm vụ:", error);
    }
  }

  function updateLearningStatistics() {
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999);

    const relevantTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return taskDate <= currentDate;
    });

    const completedTasks = relevantTasks.filter(
      (task) => task.completed
    ).length;
    const totalTasks = relevantTasks.length;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const ctx = document.getElementById("progressChart").getContext("2d");

    new Chart(ctx, {
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

  // Thêm hàm mới để kiểm tra hoàn thành nhiệm vụ game tiếng Anh
  async function checkEnglishGameCompletion() {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/check-english-game-completion/${userId}`
      );
      const data = await response.json();
      if (data.success) {
        const completedDates = new Set(data.completedDates);
        tasks.forEach((task) => {
          if (
            task.type === "english" &&
            task.activity === "game" &&
            completedDates.has(task.date)
          ) {
            task.completed = true;
          }
        });
        updateCalendar();
      } else {
        console.error(
          "Lỗi khi kiểm tra hoàn thành game tiếng Anh:",
          data.message
        );
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra hoàn thành game tiếng Anh:", error);
    }
  }

  // Thêm hàm mới để kiểm tra hoàn thành nhiệm vụ từ vựng tiếng Anh
  async function checkEnglishVocabularyCompletion() {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/check-english-vocabulary-completion/${userId}`
      );
      const data = await response.json();
      if (data.success) {
        const completedDates = new Set(data.completedDates);
        tasks.forEach((task) => {
          if (
            task.type === "english" &&
            task.activity === "vocabulary" &&
            completedDates.has(task.date)
          ) {
            task.completed = true;
          }
        });
        updateCalendar();
      } else {
        console.error(
          "Lỗi khi kiểm tra hoàn thành từ vựng tiếng Anh:",
          data.message
        );
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra hoàn thành từ vựng tiếng Anh:", error);
    }
  }
});
