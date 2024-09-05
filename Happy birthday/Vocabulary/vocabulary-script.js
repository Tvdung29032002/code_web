document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("vocabularyForm");
  const messageElement = document.getElementById("message");
  const vocabularyList = document.getElementById("vocabularyList");
  const toggleVocabularyListButton = document.getElementById(
    "toggleVocabularyList"
  );
  const vocabularyListContainer = document.getElementById(
    "vocabularyListContainer"
  );
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const closeBtn = document.querySelector(".close");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const vocabularyData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/add-vocabulary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vocabularyData),
        }
      );

      console.log("Response status:", response.status);

      const result = await response.json();
      console.log("Response data:", result);

      if (result.success) {
        showMessage(result.message, "success");
        form.reset();
        if (vocabularyListContainer.style.display !== "none") {
          await fetchVocabulary();
        }
      } else {
        if (response.status === 400 && result.message.includes("đã tồn tại")) {
          showMessage(result.message, "warning");
        } else {
          showMessage(result.message || "Không thể thêm từ vựng", "error");
        }
      }
    } catch (error) {
      console.error("Error details:", error);
      showMessage(`Đã xảy ra lỗi khi thêm từ vựng: ${error.message}`, "error");
    }
  });

  function showMessage(message, type) {
    messageElement.textContent = message;
    messageElement.className = `message ${type} show`;
    setTimeout(() => {
      messageElement.className = "message";
    }, 3000);
  }

  toggleVocabularyListButton.addEventListener("click", () => {
    if (vocabularyListContainer.style.display === "none") {
      vocabularyListContainer.style.display = "block";
      toggleVocabularyListButton.textContent = "Hide Vocabulary List";
      fetchVocabulary(); // Tải danh sách từ vựng khi hiện
    } else {
      vocabularyListContainer.style.display = "none";
      toggleVocabularyListButton.textContent = "Show Vocabulary List";
    }
  });

  async function fetchVocabulary() {
    try {
      console.log("Fetching vocabulary...");
      const response = await fetch("http://192.168.0.103:3000/api/vocabulary");

      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Fetched vocabulary data:", result);

      if (result.success) {
        displayVocabulary(result.data);
      } else {
        showMessage(result.message || "Failed to fetch vocabulary.", "error");
      }
    } catch (error) {
      console.error("Error fetching vocabulary:", error);
      showMessage(
        `An error occurred while fetching vocabulary: ${error.message}`,
        "error"
      );
    }
  }

  function displayVocabulary(vocabularyItems) {
    vocabularyList.innerHTML = "";
    if (vocabularyItems.length === 0) {
      vocabularyList.innerHTML = "<p>No vocabulary items found.</p>";
      return;
    }
    vocabularyItems.forEach((item) => {
      const vocabularyCard = document.createElement("div");
      vocabularyCard.className = "vocabulary-item";
      vocabularyCard.innerHTML = `
        <h3>${escapeHtml(item.word)}</h3>
        <div class="vocabulary-details" style="display: none;">
          <p><strong>Meaning:</strong> ${escapeHtml(item.meaning)}</p>
          <p><strong>Phonetic:</strong> ${escapeHtml(item.phonetic)}</p>
          <p><strong>Part of Speech:</strong> ${escapeHtml(
            item.part_of_speech
          )}</p>
          <p><strong>Example:</strong> ${escapeHtml(item.example || "")}</p>
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-delete">Delete</button>
        </div>
      `;

      const editButton = vocabularyCard.querySelector(".btn-edit");
      editButton.addEventListener("click", () => {
        openEditModal(
          item.id,
          item.word,
          item.meaning,
          item.phonetic,
          item.part_of_speech,
          item.example
        );
      });

      const deleteButton = vocabularyCard.querySelector(".btn-delete");
      deleteButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this vocabulary item?")) {
          deleteVocabulary(item.id);
        }
      });

      vocabularyCard.addEventListener("click", function (e) {
        if (!e.target.classList.contains("btn")) {
          const details = this.querySelector(".vocabulary-details");
          details.style.display =
            details.style.display === "none" ? "block" : "none";
        }
      });

      vocabularyList.appendChild(vocabularyCard);
    });
  }

  function deleteVocabulary(id) {
    fetch(`http://192.168.0.103:3000/api/delete-vocabulary/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          showMessage(result.message, "success");
          fetchVocabulary(); // Refresh the vocabulary list
        } else {
          showMessage(result.message, "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showMessage(
          "An error occurred while deleting the vocabulary item.",
          "error"
        );
      });
  }

  function openEditModal(id, word, meaning, phonetic, partOfSpeech, example) {
    document.getElementById("editId").value = id;
    document.getElementById("editWord").value = word;
    document.getElementById("editMeaning").value = meaning;
    document.getElementById("editPhonetic").value = phonetic;
    document.getElementById("editPartOfSpeech").value = partOfSpeech;
    document.getElementById("editExample").value = example || "";
    editModal.style.display = "block";
  }

  closeBtn.onclick = function () {
    editModal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == editModal) {
      editModal.style.display = "none";
    }
  };

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const vocabularyData = Object.fromEntries(formData.entries());
    vocabularyData.id = document.getElementById("editId").value;

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/update-vocabulary",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vocabularyData),
        }
      );

      const result = await response.json();
      if (result.success) {
        showMessage(result.message, "success");
        editModal.style.display = "none";
        await fetchVocabulary();
      } else {
        showMessage(result.message || "Không thể cập nhật từ vựng", "error");
      }
    } catch (error) {
      console.error("Error updating vocabulary:", error);
      showMessage(
        `Đã xảy ra lỗi khi cập nhật từ vựng: ${error.message}`,
        "error"
      );
    }
  });

  function showMessage(message, type) {
    messageElement.textContent = message;
    messageElement.className = `message ${type} show`;
    setTimeout(() => {
      messageElement.className = "message";
    }, 3000);
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  async function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm === "") {
      showMessage("Please enter a search term", "warning");
      return;
    }

    try {
      const response = await fetch(
        `http://192.168.0.103:3000/api/search-vocabulary?term=${encodeURIComponent(
          searchTerm
        )}`
      );
      const result = await response.json();

      if (result.success) {
        displayVocabulary(result.data);
        vocabularyListContainer.style.display = "block";
        toggleVocabularyListButton.textContent = "Hide Vocabulary List";
      } else {
        showMessage(result.message || "No results found", "info");
      }
    } catch (error) {
      console.error("Error searching vocabulary:", error);
      showMessage(
        `An error occurred while searching: ${error.message}`,
        "error"
      );
    }
  }

  // Learning Games variables
  const startGameBtn = document.getElementById("startGameBtn");
  const gameArea = document.getElementById("game-area");
  const gameIntro = document.querySelector(".game-intro");
  const gameSummary = document.getElementById("game-summary");
  const gameQuestion = document.getElementById("game-question");
  const gameOptions = document.getElementById("game-options");
  const gameResult = document.getElementById("game-result");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const questionCounter = document.getElementById("question-counter");
  const finalScore = document.getElementById("final-score");

  let currentQuestion;
  let currentOptions;
  let correctAnswer;
  let score = 0;
  let questionNumber = 0;
  const totalQuestions = 10;

  function updateProgressBar(questionNumber) {
    const progressBar = document.querySelector(".progress-bar");
    const progress = Math.round((questionNumber / totalQuestions) * 100);
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;

    const steps = document.querySelectorAll(".step");
    steps.forEach((step, index) => {
      if (index < questionNumber) {
        step.classList.add("active");
      } else {
        step.classList.remove("active");
      }
    });
  }

  function startGame() {
    gameIntro.style.display = "none";
    gameArea.style.display = "block";
    gameSummary.style.display = "none";
    score = 0;
    questionNumber = 0;
    updateProgressBar(0);
    nextQuestion();
  }

  async function nextQuestion() {
    if (questionNumber >= totalQuestions) {
      endGame();
      return;
    }

    questionNumber++;
    updateProgressBar(questionNumber);
    console.log(`Question number: ${questionNumber}`); // Debug log

    gameResult.textContent = "";
    nextQuestionBtn.style.display = "none";
    gameOptions.innerHTML = "";

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/random-english-vocabulary"
      );
      const data = await response.json();

      if (data.success) {
        currentQuestion = data.vocabulary;
        currentOptions = [currentQuestion.meaning, ...data.distractors];
        correctAnswer = currentQuestion.meaning;

        // Đảm bảo luôn có đúng 4 tùy chọn
        while (currentOptions.length < 4) {
          currentOptions.push("Placeholder option " + currentOptions.length);
        }
        if (currentOptions.length > 4) {
          currentOptions = currentOptions.slice(0, 4);
        }

        currentOptions = shuffleArray(currentOptions);

        gameQuestion.textContent = `What is the meaning of "${currentQuestion.word}" (${currentQuestion.phonetic})?`;

        gameOptions.innerHTML = ""; // Xóa các tùy chọn cũ
        currentOptions.forEach((option) => {
          const button = document.createElement("button");
          button.textContent = option;
          button.classList.add("btn", "option-btn");
          button.addEventListener("click", () => checkAnswer(option));
          gameOptions.appendChild(button);
        });
      } else {
        showMessage("Failed to fetch question", "error");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      showMessage("Error fetching question", "error");
    }
  }

  function checkAnswer(selectedAnswer) {
    const optionButtons = document.querySelectorAll(".option-btn");
    optionButtons.forEach((button) => {
      button.disabled = true;
      if (button.textContent === selectedAnswer) {
        button.classList.add("selected");
      }
      if (button.textContent === correctAnswer) {
        button.classList.add("correct");
      }
    });

    if (selectedAnswer === correctAnswer) {
      gameResult.textContent = "Correct!";
      gameResult.style.color = "#4caf50";
      score++;
    } else {
      gameResult.textContent = `Incorrect. The correct answer is: ${correctAnswer}`;
      gameResult.style.color = "#f44336";
      optionButtons.forEach((button) => {
        if (button.textContent === selectedAnswer) {
          button.classList.add("incorrect");
        }
      });
    }

    nextQuestionBtn.style.display = "block";
    nextQuestionBtn.textContent =
      questionNumber < totalQuestions ? "Next Question" : "Finish Game";
  }

  function endGame() {
    gameArea.style.display = "none";
    gameSummary.style.display = "block";
    finalScore.textContent = `${score}/${totalQuestions}`;

    const userId = getCurrentUserId();
    if (userId) {
      fetch("http://192.168.0.103:3000/api/end-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, score }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            console.log("Điểm số đã được lưu thành công");
            // Gọi hàm fetchAndDisplayLeaderboard sau khi điểm số được lưu
            fetchAndDisplayLeaderboard();
          } else {
            console.error("Không thể lưu điểm số:", result.message);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi lưu điểm số:", error);
        });
    } else {
      console.error("Không tìm thấy ID người dùng");
      // Vẫn gọi fetchAndDisplayLeaderboard ngay cả khi không có ID người dùng
      fetchAndDisplayLeaderboard();
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Thêm hàm mới để lấy và hiển thị tên người dùng
  function getCurrentUser() {
    const userString = localStorage.getItem("currentUser");
    return userString ? JSON.parse(userString) : null;
  }

  async function fetchAndDisplayUserName() {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const userNameElement = document.getElementById("userName");
      if (userNameElement) {
        userNameElement.textContent = `Xin chào, ${currentUser.firstName} ${currentUser.lastName}!`;
      }
    } else {
      console.error("Không tìm thấy thông tin người dùng");
    }
  }

  // Thay thế hàm getCurrentUserId bằng hàm này
  function getCurrentUserId() {
    const currentUser = getCurrentUser();
    return currentUser ? currentUser.id : null;
  }

  // Thêm hàm mới để lấy và hiển thị bảng xếp hạng
  async function fetchAndDisplayLeaderboard() {
    try {
      const response = await fetch("http://192.168.0.103:3000/api/leaderboard");
      const result = await response.json();
      const currentUser = getCurrentUser();

      if (result.success) {
        const leaderboardBody = document.getElementById("leaderboardBody");
        leaderboardBody.innerHTML = "";

        result.data.forEach((entry, index) => {
          const row = document.createElement("tr");
          let rankDisplay = "";

          if (index === 0) {
            rankDisplay = '<span class="medal">🥇</span>';
          } else if (index === 1) {
            rankDisplay = '<span class="medal">🥈</span>';
          } else if (index === 2) {
            rankDisplay = '<span class="medal">🥉</span>';
          } else {
            rankDisplay = `<span class="rank-number">${index + 1}</span>`;
          }

          const displayName =
            entry.userId === currentUser.id
              ? `${currentUser.firstName} ${currentUser.lastName}`
              : entry.username;

          row.innerHTML = `
            <td class="rank-column">${rankDisplay}</td>
            <td>${displayName}</td>
            <td>${entry.max_score}</td>
          `;
          leaderboardBody.appendChild(row);
        });
      } else {
        showMessage("Không thể lấy bảng xếp hạng", "error");
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      showMessage("Đã xảy ra lỗi khi lấy bảng xếp hạng", "error");
    }
  }

  // Gọi hàm fetchAndDisplayLeaderboard khi trang được tải
  fetchAndDisplayLeaderboard();

  // Event listeners for game
  startGameBtn.addEventListener("click", startGame);
  nextQuestionBtn.addEventListener("click", nextQuestion);
  playAgainBtn.addEventListener("click", startGame);

  // Gọi hàm fetchAndDisplayUserName khi trang được tải
  fetchAndDisplayUserName();
});
