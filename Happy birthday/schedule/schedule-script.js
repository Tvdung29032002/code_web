document.addEventListener("DOMContentLoaded", function () {
  const calendar = document.getElementById("calendar");
  const monthYearElement = document.getElementById("monthYear");
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
  }

  function createCalendar(month, year) {
    calendar.innerHTML = "";
    monthYearElement.textContent = `${new Date(year, month).toLocaleString(
      "default",
      { month: "long" }
    )} ${year}`;

    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);

    for (let i = 0; i < firstDay; i++) {
      calendar.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.classList.add("day");
      if (
        day === now.getDate() &&
        month === currentMonth &&
        year === currentYear
      ) {
        dayElement.classList.add("today");
      }

      const dayNumber = document.createElement("div");
      dayNumber.classList.add("day-number");
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);

      const vocabTask = document.createElement("div");
      vocabTask.classList.add("task");
      vocabTask.textContent = "10 new words";
      dayElement.appendChild(vocabTask);

      const gameTask = document.createElement("div");
      gameTask.classList.add("task");
      gameTask.textContent = "Play game";
      dayElement.appendChild(gameTask);

      // Simulate task completion (you'll need to implement actual logic)
      if (day < now.getDate()) {
        const completed = Math.random() < 0.7; // 70% chance of completion
        if (completed) {
          vocabTask.classList.add("completed");
          gameTask.classList.add("completed");
        } else {
          vocabTask.classList.add("missed");
          gameTask.classList.add("missed");
        }
      }

      calendar.appendChild(dayElement);
    }
  }

  createCalendar(currentMonth, currentYear);
});
