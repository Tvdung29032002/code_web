document.addEventListener("DOMContentLoaded", function () {
  function toggleContent(button) {
    const content = button.nextElementSibling;
    const isExpanded = content.style.display === "block";
    content.style.display = isExpanded ? "none" : "block";

    const visibleText = button.textContent
      .replace(/Xem thêm|Ẩn bớt/, "")
      .trim();
    button.innerHTML = `${
      isExpanded ? "Xem thêm" : "Ẩn bớt"
    } <span class="visually-hidden">${visibleText}</span>`;
  }

  const searchHelp = document.getElementById("searchHelp");
  const sections = document.querySelectorAll("main section");
  const expandButtons = document.querySelectorAll(".expand-btn");

  searchHelp.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();

    sections.forEach((section) => {
      if (searchTerm === "") {
        // Hiển thị tất cả các phần và xóa đánh dấu khi ô tìm kiếm trống
        section.style.display = "block";
        removeHighlights(section);

        // Khôi phục trạng thái của nút "Xem thêm" và nội dung mở rộng
        const expandBtn = section.querySelector(".expand-btn");
        const expandedContent = section.querySelector(".expanded-content");
        if (expandBtn && expandedContent) {
          expandBtn.innerHTML = `Xem thêm <span class="visually-hidden">${expandBtn.textContent
            .replace(/Xem thêm|Ẩn bớt/, "")
            .trim()}</span>`;
          expandedContent.style.display = "none";
        }
      } else {
        const content = section.textContent.toLowerCase();
        const matchFound = content.includes(searchTerm);

        if (matchFound) {
          section.style.display = "block";
          highlightMatches(section, searchTerm);

          // Hiển thị nội dung mở rộng khi tìm thấy kết quả
          const expandedContent = section.querySelector(".expanded-content");
          if (expandedContent) {
            expandedContent.style.display = "block";
          }
          const expandBtn = section.querySelector(".expand-btn");
          if (expandBtn) {
            expandBtn.innerHTML = `Ẩn bớt <span class="visually-hidden">${expandBtn.textContent
              .replace(/Xem thêm|Ẩn bớt/, "")
              .trim()}</span>`;
          }
        } else {
          section.style.display = "none";
        }
      }
    });

    // Cuộn đến kết quả đầu tiên nếu có
    if (searchTerm !== "") {
      const firstVisibleSection = document.querySelector(
        "main section[style='display: block;']"
      );
      if (firstVisibleSection) {
        const firstMatch = firstVisibleSection.querySelector("mark");
        if (firstMatch) {
          firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  });

  function highlightMatches(element, searchTerm) {
    removeHighlights(element);
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const newNode = document.createElement("span");
        newNode.innerHTML = node.textContent.replace(regex, "<mark>$1</mark>");
        node.parentNode.replaceChild(newNode, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        highlightMatches(node, searchTerm);
      }
    });
  }

  function removeHighlights(element) {
    element.querySelectorAll("mark").forEach((mark) => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  document.getElementById("openChat").addEventListener("click", function (e) {
    e.preventDefault();
    alert("Tính năng chat đang được phát triển. Vui lòng thử lại sau!");
  });

  document
    .getElementById("supportForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      alert(
        "Cảm ơn bạn đã gửi yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất!"
      );
      this.reset();
    });

  const backToTopButton = document.getElementById("backToTop");

  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add("show");
      } else {
        backToTopButton.classList.remove("show");
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const feedbackButton = document.getElementById("feedbackButton");
  const feedbackModal = document.getElementById("feedbackModal");

  if (feedbackButton && feedbackModal) {
    const closeButton = feedbackModal.querySelector(".close");
    const feedbackForm = document.getElementById("feedbackForm");

    feedbackButton.addEventListener("click", () => {
      feedbackModal.style.display = "block";
    });

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        feedbackModal.style.display = "none";
      });
    }

    window.addEventListener("click", (event) => {
      if (event.target === feedbackModal) {
        feedbackModal.style.display = "none";
      }
    });

    if (feedbackForm) {
      feedbackForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const rating = document.querySelector('input[name="rating"]:checked');
        const feedbackText = document.getElementById("feedbackText");

        if (!rating || !feedbackText.value.trim()) {
          alert("Vui lòng chọn đánh giá và nhập nội dung phản hồi.");
          return;
        }

        const userId = localStorage.getItem("userId");
        if (!userId) {
          alert("Vui lòng đăng nhập để gửi phản hồi.");
          // Chuyển hướng đến trang đăng nhập nếu cần
          return;
        }

        const feedbackData = {
          userId: userId,
          rating: rating.value,
          category: "other",
          content: feedbackText.value.trim(),
        };

        fetch("http://192.168.0.103:3000/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedbackData),
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            if (data.success) {
              alert("Cảm ơn bạn đã gửi phản hồi!");
              feedbackModal.style.display = "none";
              feedbackForm.reset();
            } else {
              throw new Error(data.message || "Không thể gửi phản hồi");
            }
          })
          .catch((error) => {
            console.error("Lỗi khi gửi phản hồi:", error);
            alert("Có lỗi xảy ra khi gửi phản hồi: " + error.message);
          });
      });
    }
  }

  // Thêm hàm toggleContent vào window object để có thể gọi từ HTML
  window.toggleContent = toggleContent;

  const homeButton = document.querySelector(".home-button");
  if (homeButton) {
    homeButton.addEventListener("click", function (e) {
      e.preventDefault();
      const homeUrl = this.getAttribute("href");

      // Thêm hiệu ứng fade out
      document.body.style.opacity = 0;

      setTimeout(() => {
        window.location.href = homeUrl;
      }, 500); // Đợi 500ms trước khi chuyển trang
    });
  }
});
