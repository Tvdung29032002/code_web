document
  .getElementById("vocabularyForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const word = document.getElementById("word").value;
    const meaning = document.getElementById("meaning").value;

    fetch("http://localhost:3000/api/add-vocabulary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word, meaning }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showMessage(data.message, "success");
          document.getElementById("word").value = "";
          document.getElementById("meaning").value = "";
          fetchAllVocabulary();
        } else {
          showMessage("Error: " + data.message, "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showMessage("An error occurred. Please try again.", "error");
      });
  });

document
  .getElementById("showAllBtn")
  .addEventListener("click", fetchAllVocabulary);

function fetchAllVocabulary() {
  fetch("http://localhost:3000/api/get-all-vocabulary")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayVocabulary(data.data);
      } else {
        showMessage("Error: " + data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showMessage("An error occurred while fetching vocabulary.", "error");
    });
}

function displayVocabulary(vocabularyList) {
  const vocabularyListElement = document.getElementById("vocabularyList");
  vocabularyListElement.innerHTML = "";

  vocabularyList.forEach((item) => {
    const vocabularyItem = document.createElement("div");
    vocabularyItem.className = "vocabulary-item";
    vocabularyItem.innerHTML = `
            <h3>${item.word}</h3>
            <p>${item.meaning}</p>
        `;
    vocabularyListElement.appendChild(vocabularyItem);
  });
}

function showMessage(message, type) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = message;
  messageElement.className = `message ${type} show`;

  setTimeout(() => {
    messageElement.classList.remove("show");
  }, 3000);
}

// Fetch all vocabulary when the page loads
fetchAllVocabulary();
