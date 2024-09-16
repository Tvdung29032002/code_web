// main.js

import {
  displayNotifications,
  displayTodayTasks,
  fetchTodayTasks,
  fetchUpcomingTasks,
} from "./tasks.js";
import { checkUserRole, initUI } from "./ui.js";
import { initWeather } from "./weather.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize UI
  initUI();

  // Fetch and display tasks
  const todayTasks = await fetchTodayTasks();
  displayTodayTasks(todayTasks);

  const upcomingTasks = await fetchUpcomingTasks();
  displayNotifications(upcomingTasks);

  // Update notification count
  const notificationIcon = document.getElementById("notificationIcon");
  const notificationCount = document.createElement("span");
  notificationCount.className = "notification-count";
  notificationCount.textContent = upcomingTasks.length;
  notificationIcon.appendChild(notificationCount);

  // Initialize weather
  const toggleIcon = document.getElementById("toggleIcon");
  const cityList = document.getElementById("cityList");
  const cityDropdown = document.querySelector(".city-dropdown");
  const citySearch = document.getElementById("citySearch");
  const selectedCity = document.getElementById("selectedCity");

  await initWeather(
    toggleIcon,
    cityList,
    cityDropdown,
    citySearch,
    selectedCity
  );

  // Check and apply user role permissions
  checkUserRole();
});
