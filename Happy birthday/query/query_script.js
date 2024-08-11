document.addEventListener("DOMContentLoaded", function () {
  const executeQueryButton = document.getElementById("executeQuery");
  const clearQueryButton = document.getElementById("clearQuery");
  const loadSavedQueryButton = document.getElementById("loadSavedQuery");
  const sqlQueryTextarea = document.getElementById("sqlQuery");
  const resultsDiv = document.getElementById("results");
  const saveQueryCheckbox = document.getElementById("saveQuery");
  const limitResultsCheckbox = document.getElementById("limitResults");
  const resultLimitInput = document.getElementById("resultLimit");

  executeQueryButton.addEventListener("click", async () => {
    const sqlQuery = sqlQueryTextarea.value;
    const limitResults = limitResultsCheckbox.checked;
    const resultLimit = limitResults ? parseInt(resultLimitInput.value) : null;

    resultsDiv.innerHTML =
      '<div class="loading">Executing query...<div class="spinner"></div></div>';

    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/execute-custom-query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: sqlQuery, limit: resultLimit }),
        }
      );
      const data = await response.json();

      if (data.success) {
        displayResults(data.data);
        if (saveQueryCheckbox.checked) {
          localStorage.setItem("savedQuery", sqlQuery);
        }
      } else {
        resultsDiv.innerHTML = `<p class="error">Error: ${data.message}</p>`;
      }
    } catch (error) {
      resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  });

  clearQueryButton.addEventListener("click", () => {
    sqlQueryTextarea.value = "";
    resultsDiv.innerHTML = "";
  });

  loadSavedQueryButton.addEventListener("click", () => {
    const savedQuery = localStorage.getItem("savedQuery");
    if (savedQuery) {
      sqlQueryTextarea.value = savedQuery;
    } else {
      alert("No saved query found.");
    }
  });

  function displayResults(data) {
    if (data.length === 0) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    let tableHtml = "<table><thead>";
    const headers = Object.keys(data[0]);
    tableHtml +=
      "<tr>" + headers.map((header) => `<th>${header}</th>`).join("") + "</tr>";
    tableHtml += "</thead><tbody>";

    data.forEach((row) => {
      tableHtml += "<tr>";
      headers.forEach((header) => {
        tableHtml += `<td>${row[header]}</td>`;
      });
      tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";
    resultsDiv.innerHTML = tableHtml;
  }
});
