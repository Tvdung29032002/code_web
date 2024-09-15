// calendar.js

import {
  tasks,
  fetchTasks,
  checkAndAddFixedTasks,
  checkEnglishGameCompletion,
  checkEnglishVocabularyCompletion,
  currentDate,
} from "./tasks.js";
import {
  formatDate,
  createTaskElement,
  showTaskForm,
  updateLearningStatistics,
} from "./utils.js";

export let currentView = "month";

// Thêm các biến DOM này
let calendar, monthYearElement;

document.addEventListener("DOMContentLoaded", () => {
  calendar = document.getElementById("calendar");
  monthYearElement = document.getElementById("monthYear");
});

function createCalendar(date) {
  if (!calendar || !monthYearElement) return;

  calendar.innerHTML = "";
  monthYearElement.textContent = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  createMonthView(date);
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

// Xóa hàm createWeekView nếu không cần thiết nữa

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

function updateCalendar() {
  createCalendar(currentDate, currentView);
}

// Đảm bảo rằng updateCalendar được export
export { createCalendar, updateCalendar };
