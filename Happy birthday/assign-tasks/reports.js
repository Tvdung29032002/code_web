Chart.register(ChartDataLabels);

let charts = {};

document.addEventListener("DOMContentLoaded", async function () {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Vui lòng đăng nhập để xem báo cáo.");
    window.location.href = "/login.html";
    return;
  }

  const timeRangeSelect = document.getElementById("timeRangeSelect");
  timeRangeSelect.addEventListener("change", () => loadReports(userId));

  await loadReports(userId);

  const backToHomeButton = document.getElementById("backToHome");
  backToHomeButton.addEventListener("click", function () {
    window.location.href = "../index.html";
  });
});

async function loadReports(userId) {
  try {
    const timeRange = document.getElementById("timeRangeSelect").value;
    const response = await fetch(
      `http://192.168.0.103:3000/api/task-reports/${userId}?timeRange=${timeRange}`
    );
    const result = await response.json();

    if (result.success) {
      displayTaskOverview(result.reports.overview, timeRange);
      displayTaskProgress(result.reports.progress, timeRange);
      displayTaskPriority(result.reports.overview, timeRange);
    } else {
      console.error("Lỗi khi tải dữ liệu báo cáo:", result.message);
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

function displayTaskOverview(overview, timeRange) {
  const ctx = document.getElementById("taskOverviewChart").getContext("2d");

  if (charts.taskOverview) {
    charts.taskOverview.destroy();
  }

  const taskOverviewData = {
    labels: ["Hoàn thành", "Đang thực hiện", "Quá hạn"],
    datasets: [
      {
        data: [overview.completed, overview.inProgress, overview.overdue],
        backgroundColor: ["#4CAF50", "#2196F3", "#F44336"],
      },
    ],
  };

  charts.taskOverview = new Chart(ctx, {
    type: "doughnut",
    data: taskOverviewData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: `Tổng quan nhiệm vụ (${
            timeRange === "year" ? "Năm gần nhất" : "Tháng hiện tại"
          })`,
        },
      },
    },
  });
}

function displayTaskProgress(progress, timeRange) {
  const ctx = document.getElementById("taskProgressChart").getContext("2d");

  if (charts.taskProgress) {
    charts.taskProgress.destroy();
  }

  const labels = progress.map((item) => new Date(item.date));
  const data = progress.map((item) => item.count);

  const taskProgressData = {
    labels: labels,
    datasets: [
      {
        label: "Nhiệm vụ được tạo",
        data: data,
        borderColor: "#4CAF50",
        tension: 0.1,
      },
    ],
  };

  charts.taskProgress = new Chart(ctx, {
    type: "line",
    data: taskProgressData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: `Tiến độ theo thời gian (${
            timeRange === "year" ? "Năm gần nhất" : "Tháng hiện tại"
          })`,
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: timeRange === "year" ? "month" : "day",
            displayFormats: {
              day: "dd/MM",
              month: "MM/yyyy",
            },
          },
          title: {
            display: true,
            text: timeRange === "year" ? "Tháng" : "Ngày",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Số nhiệm vụ được tạo",
          },
        },
      },
    },
  });
}

function displayTaskPriority(overview, timeRange) {
  const ctx = document.getElementById("taskPriorityChart").getContext("2d");

  if (charts.taskPriority) {
    charts.taskPriority.destroy();
  }

  const taskPriorityData = {
    labels: ["Cao", "Trung bình", "Thấp"],
    datasets: [
      {
        data: [
          overview.highPriority,
          overview.mediumPriority,
          overview.lowPriority,
        ],
        backgroundColor: ["#F44336", "#FFC107", "#4CAF50"],
      },
    ],
  };

  charts.taskPriority = new Chart(ctx, {
    type: "pie",
    data: taskPriorityData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: `Phân bổ ưu tiên (${
            timeRange === "year" ? "Năm gần nhất" : "Tháng hiện tại"
          })`,
        },
      },
    },
  });
}
