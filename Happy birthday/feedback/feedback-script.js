function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const LOGIN_PAGE_URL = "http://192.168.0.103:5500/login.html"; // Điều chỉnh URL này nếu cần

document.addEventListener("DOMContentLoaded", function () {
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackList = document.getElementById("feedbackList");
  const filterCategory = document.getElementById("filterCategory");
  const sortBy = document.getElementById("sortBy");
  const searchInput = document.getElementById("searchInput");

  function fetchAndDisplayFeedback() {
    const category = filterCategory.value;
    const sort = sortBy.value;
    const search = searchInput.value;

    fetch(
      `http://192.168.0.103:3000/api/feedback?category=${category}&sort=${sort}&search=${search}`,
      {
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success && data.feedback) {
          feedbackList.innerHTML = "";
          if (data.feedback.length === 0) {
            feedbackList.innerHTML = "<li>Không có đánh giá nào.</li>";
          } else {
            data.feedback.forEach((item) => {
              const li = document.createElement("li");
              const createdAt = new Date(item.created_at);
              const formattedDate = createdAt.toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              li.innerHTML = `
                <strong>${item.username}</strong> - ${item.category}<br>
                Đánh giá: ${"★".repeat(item.rating)}${"☆".repeat(
                5 - item.rating
              )}<br>
                ${item.content}<br>
                <small>Đăng lúc: ${formattedDate}</small><br>
                <button class="helpful-btn" data-id="${item.id}">Hữu ích (${
                item.helpful_count || 0
              })</button>
              `;
              feedbackList.appendChild(li);
            });
          }
        } else {
          throw new Error("Dữ liệu không hợp lệ từ server");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi lấy feedback:", error);
        feedbackList.innerHTML = `<li>Có lỗi xảy ra khi tải đánh giá: ${error.message}</li>`;
      });
  }

  fetchAndDisplayFeedback();

  filterCategory.addEventListener("change", fetchAndDisplayFeedback);
  sortBy.addEventListener("change", fetchAndDisplayFeedback);
  searchInput.addEventListener("input", debounce(fetchAndDisplayFeedback, 300));

  // Thêm xử lý sự kiện submit cho form
  feedbackForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để gửi đánh giá.");
      window.location.href = LOGIN_PAGE_URL;
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      window.location.href = LOGIN_PAGE_URL;
      return;
    }

    const rating = document.querySelector('input[name="rating"]:checked');
    const category = document.getElementById("feedbackCategory");
    const content = document.getElementById("feedbackContent");

    if (!rating || !category.value || !content.value) {
      alert("Vui lòng điền đầy đủ thông tin đánh giá.");
      return;
    }

    const feedbackData = {
      userId: userId,
      rating: rating.value,
      category: category.value,
      content: content.value,
    };

    fetch("http://192.168.0.103:3000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedbackData),
      credentials: "include", // Quan trọng: gửi cookie với mỗi yêu cầu
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            );
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          alert("Đánh giá của bạn đã được gửi thành công!");
          feedbackForm.reset();
          fetchAndDisplayFeedback();
        } else {
          throw new Error(data.message || "Không thể gửi đánh giá");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi gửi đánh giá:", error);
        if (
          error.message ===
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        ) {
          alert(error.message);
          window.location.href = LOGIN_PAGE_URL;
        } else {
          alert("Có lỗi xảy ra khi gửi đánh giá: " + error.message);
        }
      });
  });

  // Xử lý nút "Hữu ích"
  feedbackList.addEventListener("click", function (e) {
    if (e.target.classList.contains("helpful-btn")) {
      const feedbackId = e.target.dataset.id;
      const userId = localStorage.getItem("userId");

      if (!userId) {
        alert("Vui lòng đăng nhập để đánh giá hữu ích.");
        window.location.href = LOGIN_PAGE_URL;
        return;
      }

      fetch(`http://192.168.0.103:3000/api/feedback/${feedbackId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId }),
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.message || "Không thể đánh dấu là hữu ích");
            });
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            alert("Đã đánh dấu là hữu ích.");
            fetchAndDisplayFeedback(); // Cập nhật danh sách đánh giá
          } else {
            throw new Error(data.message || "Không thể đánh dấu là hữu ích");
          }
        })
        .catch((error) => {
          console.error("Lỗi khi đánh dấu hữu ích:", error);
          alert(error.message);
        });
    }
  });
});
