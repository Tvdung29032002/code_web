// tasks.js

import { formatDate } from "./tasks-utils.js";

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
      await addFixedTasksForCurrentMonth();
      await checkEnglishGameCompletion();
      await checkEnglishVocabularyCompletion();
    }
  } catch (error) {
    // Giữ lại thông báo lỗi này vì nó quan trọng
    console.error("Lỗi khi lấy nhiệm vụ:", error);
  }
}

export async function addFixedTasksForCurrentMonth() {
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

  for (
    let day = new Date(firstDayOfMonth);
    day <= lastDayOfMonth;
    day.setDate(day.getDate() + 1)
  ) {
    const dateString = formatDate(day);

    // Kiểm tra nhiệm vụ "Tiếng Anh - Từ vựng"
    const existingVocabTask = tasks.find(
      (task) =>
        task.date === dateString &&
        task.type === "english" &&
        task.activity === "vocabulary" &&
        task.isFixed
    );
    if (!existingVocabTask) {
      await addFixedTask({
        name: "Tiếng Anh - Từ vựng",
        type: "english",
        activity: "vocabulary",
        date: dateString,
      });
    }

    // Kiểm tra nhiệm vụ "Tiếng Anh - Minigame"
    const existingGameTask = tasks.find(
      (task) =>
        task.date === dateString &&
        task.type === "english" &&
        task.activity === "game" &&
        task.isFixed
    );
    if (!existingGameTask) {
      await addFixedTask({
        name: "Tiếng Anh - Minigame",
        type: "english",
        activity: "game",
        date: dateString,
      });
    }
  }
}

async function addFixedTask(task) {
  try {
    const response = await fetch(`http://192.168.0.103:3000/api/tasks/fixed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...task, userId, isFixed: true }),
    });
    const data = await response.json();
    if (data.success) {
      if (data.taskId) {
        tasks.push({
          ...task,
          id: data.taskId,
          isFixed: true,
          completed: false,
        });
      }
    }
  } catch (error) {
    console.error("Lỗi khi thêm nhiệm vụ cố định:", error);
  }
}

export async function addTask(task) {
  try {
    const response = await fetch(`http://192.168.0.103:3000/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...task, userId }),
    });
    const data = await response.json();
    if (data.success) {
      tasks.push({ ...task, id: data.taskId });
    }
  } catch (error) {
    console.error("Lỗi khi thêm nhiệm vụ:", error);
  }
}

export async function updateTask(updatedTask) {
  try {
    if (
      updatedTask.isFixed &&
      updatedTask.type === "english" &&
      (updatedTask.activity === "vocabulary" || updatedTask.activity === "game")
    ) {
      console.error(
        "Không thể cập nhật nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame"
      );
      return;
    }
    const response = await fetch(
      `http://192.168.0.103:3000/api/tasks/${updatedTask.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      }
    );
    const data = await response.json();
    if (data.success) {
      const index = tasks.findIndex((task) => task.id === updatedTask.id);
      if (index !== -1) {
        tasks[index] = updatedTask;
      }
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiệm vụ:", error);
  }
}

export async function deleteTask(taskId) {
  try {
    const taskToDelete = tasks.find((task) => task.id === taskId);
    if (
      taskToDelete &&
      taskToDelete.isFixed &&
      taskToDelete.type === "english" &&
      (taskToDelete.activity === "vocabulary" ||
        taskToDelete.activity === "game")
    ) {
      console.error(
        "Không thể xóa nhiệm vụ cố định Tiếng Anh - Từ vựng hoặc Minigame"
      );
      return;
    }
    const response = await fetch(
      `http://192.168.0.103:3000/api/tasks/${taskId}`,
      {
        method: "DELETE",
      }
    );
    const data = await response.json();
    if (data.success) {
      tasks = tasks.filter((task) => task.id !== taskId);
    }
  } catch (error) {
    console.error("Lỗi khi xóa nhiệm vụ:", error);
  }
}

export async function checkEnglishGameCompletion() {
  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/check-english-game-completion/${userId}`
    );
    const data = await response.json();
    if (data.success) {
      data.completedDates.forEach((date) => {
        const task = tasks.find(
          (t) =>
            t.date === date && t.type === "english" && t.activity === "game"
        );
        if (task) {
          task.completed = true;
        }
      });
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra hoàn thành game tiếng Anh:", error);
  }
}

export async function checkEnglishVocabularyCompletion() {
  try {
    const response = await fetch(
      `http://192.168.0.103:3000/api/check-english-vocabulary-completion/${userId}`
    );
    const data = await response.json();
    if (data.success) {
      data.completedDates.forEach((date) => {
        const task = tasks.find(
          (t) =>
            t.date === date &&
            t.type === "english" &&
            t.activity === "vocabulary"
        );
        if (task) {
          task.completed = true;
        }
      });
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra hoàn thành từ vựng tiếng Anh:", error);
  }
}
