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

    console.log(
      "Submitting vocabulary data:",
      JSON.stringify(vocabularyData, null, 2)
    );

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
});
