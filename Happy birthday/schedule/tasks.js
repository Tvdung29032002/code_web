// tasks.js

import { formatDate } from "./utils.js";

export let tasks = [];
export const userId = localStorage.getItem("userId");

// Thêm biến currentDate và export nó
export let currentDate = new Date();

export async function fetchTasks() {
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
      await checkEnglishVocabularyCompletion();
    } else {
      console.error("Lỗi khi lấy nhiệm vụ:", data.message);
    }
  } catch (error) {
    console.error("Lỗi khi lấy nhiệm vụ:", error);
  }
}

export async function checkAndAddFixedTasks() {
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

  // ... phần còn lại của hàm giữ nguyên
}

// Thêm các hàm khác như addTask, updateTask, deleteTask, checkEnglishGameCompletion, checkEnglishVocabularyCompletion
// và export chúng

export async function addTask(task) {
  // ... code của hàm addTask
}

export async function updateTask(taskId, updatedTask) {
  // ... code của hàm updateTask
}

export async function deleteTask(taskId) {
  // ... code của hàm deleteTask
}

export async function checkEnglishGameCompletion() {
  // ... code của hàm checkEnglishGameCompletion
}

export async function checkEnglishVocabularyCompletion() {
  // ... code của hàm checkEnglishVocabularyCompletion
}
