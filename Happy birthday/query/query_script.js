document.addEventListener("DOMContentLoaded", function () {
  const executeQueryButton = document.getElementById("executeQuery");
  const clearQueryButton = document.getElementById("clearQuery");
  const loadSavedQueryButton = document.getElementById("loadSavedQuery");
  const sqlQueryTextarea = document.getElementById("sqlQuery");
  const resultsDiv = document.getElementById("results");
  const saveQueryCheckbox = document.getElementById("saveQuery");
  const limitResultsCheckbox = document.getElementById("limitResults");
  const resultLimitInput = document.getElementById("resultLimit");
  const tableListDiv = document.getElementById("tableList");

  // Hàm để lấy danh sách bảng từ server
  async function fetchTableList() {
    try {
      const response = await fetch(
        "http://192.168.0.103:3000/api/get-table-list"
      );
      const data = await response.json();
      if (data.success) {
        displayTableList(data.tables);
      } else {
        console.error("Lỗi khi lấy danh sách bảng:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bảng:", error);
    }
  }

  // Hàm để hiển thị danh sách bảng
  function displayTableList(tables) {
    tableListDiv.innerHTML = tables
      .map(
        (table) => `
      <div class="table-item" data-table="${table}">
        ${table}
      </div>
    `
      )
      .join("");

    // Thêm event listener cho mỗi table item
    document.querySelectorAll(".table-item").forEach((item) => {
      item.addEventListener("click", () => {
        const tableName = item.dataset.table;
        sqlQueryTextarea.value = `SELECT * FROM ${tableName} LIMIT 10;`;
      });
    });
  }

  // Gọi hàm để lấy danh sách bảng khi trang được tải
  fetchTableList();

  executeQueryButton.addEventListener("click", async () => {
    const sqlQuery = sqlQueryTextarea.value;
    const limitResults = limitResultsCheckbox.checked;
    const resultLimit = limitResults ? parseInt(resultLimitInput.value) : null;

    resultsDiv.innerHTML =
      '<div class="loading">Đang thực hiện truy vấn...<div class="spinner"></div></div>';

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
        resultsDiv.innerHTML = `<p class="error">Lỗi: ${data.message}</p>`;
      }
    } catch (error) {
      resultsDiv.innerHTML = `<p class="error">Lỗi: ${error.message}</p>`;
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
      resultsDiv.innerHTML = "<p>Không tìm thấy kết quả.</p>";
      return;
    }

    let tableHtml = "<div class='table-responsive'><table><thead>";
    const headers = Object.keys(data[0]);
    tableHtml +=
      "<tr>" + headers.map((header) => `<th>${header}</th>`).join("") + "</tr>";
    tableHtml += "</thead><tbody>";

    data.forEach((row) => {
      tableHtml += "<tr>";
      headers.forEach((header) => {
        const cellValue = row[header] !== null ? row[header] : "<em>null</em>";
        tableHtml += `<td>${cellValue}</td>`;
      });
      tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table></div>";
    resultsDiv.innerHTML = `
      <div class="results-summary">
        <p>Số hàng trả về: ${data.length}</p>
      </div>
      ${tableHtml}
    `;
  }
  const backButton = document.getElementById("back-button");
  backButton.addEventListener("click", () => {
    window.location.href = "/"; // Điều hướng về trang chủ
  });
});
