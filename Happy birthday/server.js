const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const englishVocabularyRoutes = require("./english-vocabulary-routes");
const chineseVocabularyRoutes = require("./chinese-vocabulary-routes");
const passwordRoutes = require("./password-routes");
const mainRoutes = require("./main-routes");
const userManagementRoutes = require("./user_management_routes");
const scheduleRoutes = require("./routes/schedule-routes");

const app = express();

// CORS configuration
const corsOptions = {
  origin: ["http://192.168.0.103:5500", "http://localhost:5500"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware setup
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(path.join(__dirname, "Vocabulary")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database configuration
const dbConfig = {
  host: "127.0.0.1",
  user: "dungtv",
  password: "Vboyht@02",
  database: "mydatabase",
  port: 3306,
};

let connection;

// Function to connect to the database
async function connectToDatabase() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database:", dbConfig.database);
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
}

// Middleware to make database connection available to routes
app.use((req, res, next) => {
  req.dbConnection = connection;
  next();
});

// Use the routes
app.use("/api", englishVocabularyRoutes);
app.use("/api", chineseVocabularyRoutes);
app.use("/api", passwordRoutes);
app.use("/api", mainRoutes);
app.use("/api", userManagementRoutes);
app.use("/api", scheduleRoutes);

// Serve vocabulary.html
app.get("/vocabulary", (req, res) => {
  res.sendFile(path.join(__dirname, "Vocabulary", "vocabulary.html"));
});

// Add this near your other route definitions
app.get("/api/weather", async (req, res) => {
  try {
    const [rows] = await connection.execute("SELECT * FROM weather");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = 3000;

// Function to start the server
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://192.168.0.103:${PORT}`);
    console.log("Uploads directory:", path.join(__dirname, "uploads"));
  });
}

// Serve static files for custom query
app.use(express.static(path.join(__dirname, "query")));

app.get("/custom-query", (req, res) => {
  res.sendFile(path.join(__dirname, "query", "query.html"));
});

// Start the server
startServer();
