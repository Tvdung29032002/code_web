const { google } = require("googleapis");
const path = require("path");
async function syncToGoogleSheets(dbConnection) {
  try {
    // Lấy tất cả dữ liệu từ bảng vocabulary
    const [rows] = await dbConnection.query("SELECT * FROM vocabulary");

    // Cấu hình xác thực cho Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "credentials.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ID của Google Spreadsheet
    const spreadsheetId = "1Jud4vy5Gc_CroSxlWQy4ekiAik3QV6W8GzPEJNqbGcY";

    // Chuẩn bị dữ liệu để đưa vào spreadsheet
    const values = rows.map((row) => [
      row.id,
      row.word,
      row.meaning,
      row.phonetic,
      row.part_of_speech,
      row.example,
      row.created_at,
      row.updated_at,
      row.is_active,
    ]);

    // Thêm tiêu đề cho các cột
    values.unshift([
      "ID",
      "Word",
      "Meaning",
      "Phonetic",
      "Part of Speech",
      "Example",
      "Created At",
      "Updated At",
      "Is Active",
    ]);

    // Cập nhật dữ liệu vào spreadsheet
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Trang tính1",
      valueInputOption: "RAW",
      resource: { values },
    });

    // Lấy số hàng và cột của dữ liệu
    const numRows = values.length;
    const numCols = values[0].length;

    // Định dạng header và thêm đường viền
    const requests = [
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: numCols,
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true },
              backgroundColor: { red: 1, green: 1, blue: 0 }, // Màu vàng
            },
          },
          fields: "userEnteredFormat(textFormat,backgroundColor)",
        },
      },
      {
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: numRows,
            startColumnIndex: 0,
            endColumnIndex: numCols,
          },
          top: { style: "SOLID" },
          bottom: { style: "SOLID" },
          left: { style: "SOLID" },
          right: { style: "SOLID" },
          innerHorizontal: { style: "SOLID" },
          innerVertical: { style: "SOLID" },
        },
      },
    ];

    // Áp dụng định dạng
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: { requests },
    });

    console.log("Đã đồng bộ dữ liệu thành công:", response.data);
    return true;
  } catch (error) {
    console.error("Lỗi khi đồng bộ dữ liệu:", error);
    return false;
  }
}

module.exports = { syncToGoogleSheets };
