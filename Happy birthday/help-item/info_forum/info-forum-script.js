document.addEventListener("DOMContentLoaded", function () {
  const categoryButtons = document.querySelectorAll(".category-btn");
  const searchInput = document.querySelector(".search-bar input");
  const newTopicBtn = document.querySelector(".new-topic-btn");
  const topicList = document.querySelector(".topic-list");
  const newTopicModal = document.getElementById("new-topic-modal");
  const newTopicForm = document.getElementById("new-topic-form");
  const sortSelect = document.getElementById("sort-select");
  const searchIcon = document.querySelector(".search-icon");

  let currentCategory = "Tất cả chủ đề";
  let currentPage = 1;
  const topicsPerPage = 10;

  async function fetchTopics(
    category = "Tất cả chủ đề",
    page = 1,
    sortBy = "newest",
    keyword = ""
  ) {
    try {
      let url = `http://192.168.0.103:3000/api/topics?page=${page}&limit=${topicsPerPage}&sortBy=${sortBy}`;
      if (category !== "Tất cả chủ đề") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        displayTopics(data.topics);
        displayPagination(data.totalPages, page);
      } else {
        console.error("Lỗi khi lấy danh sách chủ đề:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  }

  async function handleTopicClick(topicId) {
    try {
      await incrementViewCount(topicId);
      const topicDetails = await fetchTopicDetails(topicId);
      displayTopicDetailsModal(topicDetails);
      await fetchTopics(
        currentCategory,
        currentPage,
        sortSelect.value,
        searchInput.value.trim()
      );
    } catch (error) {
      console.error("Lỗi khi xử lý click chủ đề:", error);
    }
  }

  async function fetchTopicDetails(topicId) {
    const response = await fetch(
      `http://192.168.0.103:3000/api/topics/${topicId}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error("Lỗi khi lấy chi tiết chủ đề: " + data.message);
    }
    return data;
  }

  function setupEmojiPicker(modalContent) {
    const emojiButton = modalContent.querySelector("#emoji-button");
    const replyContent = modalContent.querySelector("#reply-content");
    const emojiPicker = modalContent.querySelector("#emoji-picker");

    if (!emojiButton || !replyContent || !emojiPicker) {
      console.error(
        "Không tìm thấy một hoặc nhiều phần tử cần thiết cho emoji picker"
      );
      return;
    }

    const emojis = ["😀", "😂", "😍", "🤔", "😎", "👍", "👎", "❤️", "🎉", "🔥"];

    // Tạo các nút emoji
    emojis.forEach((emoji) => {
      const emojiSpan = document.createElement("span");
      emojiSpan.textContent = emoji;
      emojiSpan.classList.add("emoji-option");
      emojiSpan.addEventListener("click", () => {
        insertEmoji(replyContent, emoji);
        emojiPicker.style.display = "none";
      });
      emojiPicker.appendChild(emojiSpan);
    });

    emojiButton.addEventListener("click", () => {
      emojiPicker.style.display =
        emojiPicker.style.display === "none" ? "flex" : "none";
    });

    // Đóng emoji picker khi click bên ngoài
    document.addEventListener("click", (event) => {
      if (
        !emojiButton.contains(event.target) &&
        !emojiPicker.contains(event.target)
      ) {
        emojiPicker.style.display = "none";
      }
    });
  }

  function insertEmoji(textarea, emoji) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    textarea.value = before + emoji + after;
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.focus();
  }

  function displayTopicDetailsModal(topicDetails) {
    const modal = document.getElementById("topic-details-modal");
    const modalContent = modal.querySelector(".modal-content");

    modalContent.querySelector(".topic-title").textContent =
      topicDetails.topic.title;
    modalContent.querySelector(
      ".topic-author"
    ).textContent = `Đăng bởi: ${topicDetails.topic.username}`;
    modalContent.querySelector(".topic-date").textContent = formatDate(
      topicDetails.topic.created_at
    );
    modalContent.querySelector(".topic-body").textContent =
      topicDetails.topic.content;
    modalContent.querySelector(
      ".view-count"
    ).textContent = `👁️ ${topicDetails.topic.view_count} lượt xem`;
    modalContent.querySelector(
      ".reply-count"
    ).textContent = `💬 ${topicDetails.posts.length} trả lời`;

    const repliesList = modalContent.querySelector(".replies-list");
    repliesList.innerHTML = topicDetails.posts
      .map(
        (post) => `
        <div class="reply">
          <p>${post.content}</p>
          <div class="reply-meta">
            <span>Trả lời bởi: ${post.username} | ${formatDate(
          post.created_at
        )}</span>
          </div>
        </div>
      `
      )
      .join("");

    modal.style.display = "block";

    setupEmojiPicker(modalContent);

    const closeBtn = modalContent.querySelector(".close");
    closeBtn.onclick = () => (modal.style.display = "none");

    const replyForm = modalContent.querySelector("#reply-form");
    replyForm.onsubmit = async (e) => {
      e.preventDefault();
      const content = document.getElementById("reply-content").value;
      const newReply = await submitReply(topicDetails.topic.id, content);
      if (newReply) {
        topicDetails.posts.push(newReply);
        repliesList.innerHTML += `
          <div class="reply">
            <p>${newReply.content}</p>
            <div class="reply-meta">
              <span>Trả lời bởi: ${newReply.username} | ${formatDate(
          newReply.created_at
        )}</span>
            </div>
          </div>
        `;
        document.getElementById("reply-content").value = "";
        document.getElementById("emoji-picker").style.display = "none";

        const replyCountElement = modalContent.querySelector(".reply-count");
        const currentReplyCount = parseInt(
          replyCountElement.textContent.match(/\d+/)[0]
        );
        replyCountElement.textContent = `💬 ${currentReplyCount + 1} trả lời`;

        await fetchTopics(
          currentCategory,
          currentPage,
          sortSelect.value,
          searchInput.value.trim()
        );
      }
    };
  }

  async function submitReply(topicId, content) {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Bạn cần đăng nhập để trả lời.");
      return null;
    }

    try {
      const response = await fetch("http://192.168.0.103:3000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, content, userId }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error("Lỗi khi gửi trả lời: " + data.message);
      }

      return {
        id: data.postId,
        content: content,
        username: localStorage.getItem("username"),
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Lỗi khi gửi trả lời:", error);
      alert("Đã xảy ra lỗi khi gửi trả lời: " + error.message);
      return null;
    }
  }

  async function incrementViewCount(topicId) {
    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/topics/${topicId}/view`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error("Lỗi khi tăng lượt xem: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API tăng lượt xem:", error);
      throw error;
    }
  }

  function displayTopics(topics) {
    topicList.innerHTML = "";
    topics.forEach((topic) => {
      const topicElement = document.createElement("div");
      topicElement.className = "topic";
      if (topic.is_pinned) {
        topicElement.classList.add("pinned");
      }
      topicElement.innerHTML = `
        ${topic.is_pinned ? '<span class="pin-icon">📌</span>' : ""}
        <a href="#" class="topic-title" data-id="${topic.id}">${topic.title}</a>
        <p class="topic-preview">${topic.content.substring(0, 100)}...</p>
        <div class="topic-meta">
          <span>Đăng bởi: ${topic.username} | ${formatDate(
        topic.created_at
      )}</span>
          <div class="topic-stats">
            <span>👁️ ${topic.view_count} lượt xem</span>
            <span>💬 ${topic.reply_count} trả lời</span>
          </div>
        </div>
      `;
      topicList.appendChild(topicElement);

      const topicTitle = topicElement.querySelector(".topic-title");
      topicTitle.addEventListener("click", async function (e) {
        e.preventDefault();
        await handleTopicClick(this.dataset.id);
      });
    });
  }

  function displayPagination(totalPages, currentPage) {
    const paginationContainer = document.querySelector(".pagination");
    paginationContainer.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const pageLink = document.createElement("a");
      pageLink.href = "#";
      pageLink.textContent = i;
      pageLink.classList.add("page-link");
      if (i === currentPage) {
        pageLink.classList.add("active");
      }
      pageLink.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i;
        fetchTopics(currentCategory, currentPage);
      });
      paginationContainer.appendChild(pageLink);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  }

  fetchTopics(currentCategory, currentPage);

  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      categoryButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.textContent;
      currentPage = 1;
      fetchTopics(
        currentCategory,
        currentPage,
        sortSelect.value,
        searchInput.value.trim()
      );
    });
  });

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  searchIcon.addEventListener("click", function () {
    performSearch();
  });

  function performSearch() {
    const keyword = searchInput.value.trim();
    currentPage = 1;
    fetchTopics(currentCategory, currentPage, sortSelect.value, keyword);
  }

  newTopicBtn.addEventListener("click", function () {
    newTopicModal.style.display = "block";
  });

  document.querySelector(".close").addEventListener("click", function () {
    newTopicModal.style.display = "none";
  });

  window.addEventListener("click", function (event) {
    if (event.target == newTopicModal) {
      newTopicModal.style.display = "none";
    }
  });

  newTopicForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("new-topic-title").value;
    const content = document.getElementById("new-topic-content").value;
    const category = document.getElementById("new-topic-category").value;
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("Bạn cần đăng nhập để tạo chủ đề mới.");
      return;
    }

    try {
      const response = await fetch("http://192.168.0.103:3000/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert("Tạo chủ đề mới thành công!");
        newTopicModal.style.display = "none";
        newTopicForm.reset();
        currentPage = 1;
        fetchTopics(
          currentCategory,
          currentPage,
          sortSelect.value,
          searchInput.value.trim()
        );
      } else {
        alert("Lỗi khi tạo chủ đề mới: " + (data.message || "Không xác định"));
      }
    } catch (error) {
      console.error("Lỗi khi gọi API tạo chủ đề mới:", error);
      alert("Đã xảy ra lỗi khi tạo chủ đề mới: " + error.message);
    }
  });

  sortSelect.addEventListener("change", function () {
    currentPage = 1; // Reset về trang đầu tiên khi thay đổi cách sắp xếp
    fetchTopics(
      currentCategory,
      currentPage,
      this.value,
      searchInput.value.trim()
    );
  });
});
