document.addEventListener("DOMContentLoaded", () => {
  const characterDisplay = document.getElementById("character-display");
  const characterPinyin = document.getElementById("character-pinyin");
  const characterMeaning = document.getElementById("character-meaning");
  const saveVocabBtn = document.getElementById("save-vocab");
  const toggleVocabularyListButton = document.getElementById(
    "toggleVocabularyList"
  );
  const vocabularyListContainer = document.getElementById(
    "vocabularyListContainer"
  );
  const vocabularyList = document.getElementById("vocabularyList");
  const messageElement = document.getElementById("message");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const closeBtn = document.querySelector(".close");

  // Daily character function
  function updateDailyCharacter() {
    fetch("http://192.168.0.103:3000/api/daily-character")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          updateDailyCharacterDisplay(
            data.character,
            data.pinyin,
            data.meaning
          );
        } else {
          showMessage("Failed to fetch daily character", "error");
        }
      })
      .catch((error) => {
        console.error("Error fetching daily character:", error);
        showMessage("Error fetching daily character", "error");
      });
  }

  function updateDailyCharacterDisplay(character, pinyin, meaning) {
    characterDisplay.textContent = character;
    characterPinyin.textContent = pinyin;
    characterMeaning.textContent = meaning;
  }

  updateDailyCharacter();
  setInterval(updateDailyCharacter, 24 * 60 * 60 * 1000);

  // Save vocabulary
  document
    .getElementById("addVocabForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const character = document.getElementById("character").value;
      const pinyin = document.getElementById("pinyin").value;
      const meaning = document.getElementById("meaning").value;
      const example = document.getElementById("example").value;

      const vocabularyData = { character, pinyin, meaning, example };

      try {
        const response = await fetch(
          "http://192.168.0.103:3000/api/add-chinese-vocabulary",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(vocabularyData),
          }
        );

        const result = await response.json();

        if (result.success) {
          showMessage(result.message, "success");
          document.getElementById("addVocabForm").reset();
          if (vocabularyListContainer.style.display !== "none") {
            await fetchVocabulary();
          }
        } else {
          if (
            response.status === 400 &&
            result.message.includes("đã tồn tại")
          ) {
            showMessage(result.message, "warning");
          } else {
            showMessage(result.message || "Không thể thêm từ vựng", "error");
          }
        }
      } catch (error) {
        console.error("Error details:", error);
        showMessage(
          `Đã xảy ra lỗi khi thêm từ vựng: ${error.message}`,
          "error"
        );
      }
    });

  // Function to display messages
  function showMessage(message, type) {
    messageElement.textContent = message;
    messageElement.className = `message ${type} show`;
    setTimeout(() => {
      messageElement.className = "message";
    }, 3000);
  }

  // Toggle vocabulary list
  toggleVocabularyListButton.addEventListener("click", async () => {
    if (vocabularyListContainer.style.display === "none") {
      vocabularyListContainer.style.display = "block";
      toggleVocabularyListButton.textContent = "Hide Vocabulary List";
      await fetchVocabulary();
    } else {
      vocabularyListContainer.style.display = "none";
      toggleVocabularyListButton.textContent = "Show Vocabulary List";
    }
  });

  async function fetchVocabulary() {
    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/chinese-vocabulary"
      );
      const result = await response.json();

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
        <h3>${escapeHtml(item.character)}</h3>
        <div class="vocabulary-details" style="display: none;">
          <p><strong>Pinyin:</strong> ${escapeHtml(item.pinyin)}</p>
          <p><strong>Meaning:</strong> ${escapeHtml(item.meaning)}</p>
          <p><strong>Example:</strong> ${escapeHtml(item.example || "")}</p>
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-delete">Delete</button>
        </div>
      `;

      const editButton = vocabularyCard.querySelector(".btn-edit");
      editButton.addEventListener("click", () => {
        openEditModal(
          item.id,
          item.character,
          item.pinyin,
          item.meaning,
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
          updateDailyCharacterDisplay(
            item.character,
            item.pinyin,
            item.meaning
          );
        }
      });

      vocabularyList.appendChild(vocabularyCard);
    });
  }

  // Delete vocabulary
  function deleteVocabulary(id) {
    fetch(`http://192.168.0.103:3000/api/delete-chinese-vocabulary/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          showMessage(result.message, "success");
          fetchVocabulary();
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

  // Open edit modal
  function openEditModal(id, character, pinyin, meaning, example) {
    document.getElementById("editId").value = id;
    document.getElementById("editCharacter").value = character;
    document.getElementById("editPinyin").value = pinyin;
    document.getElementById("editMeaning").value = meaning;
    document.getElementById("editExample").value = example || "";
    editModal.style.display = "block";
  }

  // Close modal
  closeBtn.onclick = function () {
    closeEditModal();
  };

  window.onclick = function (event) {
    if (event.target == editModal) {
      closeEditModal();
    }
  };

  function closeEditModal() {
    editModal.style.display = "none";
  }

  // Edit vocabulary
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    const character = document.getElementById("editCharacter").value;
    const pinyin = document.getElementById("editPinyin").value;
    const meaning = document.getElementById("editMeaning").value;
    const example = document.getElementById("editExample").value;

    if (!id || !character || !pinyin || !meaning) {
      showMessage("Id, character, pinyin, and meaning are required", "error");
      return;
    }

    const vocabularyData = { id, character, pinyin, meaning, example };

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/update-chinese-vocabulary",
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
        closeEditModal();
        await fetchVocabulary();
      } else {
        showMessage(result.message || "Unable to update vocabulary", "error");
      }
    } catch (error) {
      console.error("Error updating vocabulary:", error);
      showMessage(
        `An error occurred while updating vocabulary: ${error.message}`,
        "error"
      );
    }
  });

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
        `http://192.168.0.103:3000/api/search-chinese-vocabulary?term=${encodeURIComponent(
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
        "http://192.168.0.103:3000/api/random-china-vocabulary"
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

        gameQuestion.textContent = `What is the meaning of "${currentQuestion.character}" (${currentQuestion.pinyin})?`;

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
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Event listeners for game
  startGameBtn.addEventListener("click", startGame);
  nextQuestionBtn.addEventListener("click", nextQuestion);
  playAgainBtn.addEventListener("click", startGame);
});
