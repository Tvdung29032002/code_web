const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Multer setup
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Get user details route
router.get("/user-details/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log("Fetching user details for username:", username);

    const [users] = await req.dbConnection.execute(
      `SELECT u.id, u.firstName, u.lastName, u.email, u.birthDate, u.gender, 
              pi.phone, pi.bio, pi.photo_url 
       FROM users u 
       LEFT JOIN personal_info pi ON u.id = pi.user_id 
       WHERE u.username = ?`,
      [username]
    );

    console.log("Query result:", users);

    if (users.length === 0) {
      console.log("User not found");
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng.",
      });
    }

    const user = users[0];
    console.log("Sending user data:", user);

    res.json({
      success: true,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        birthDate: user.birthDate,
        gender: user.gender,
        phone: user.phone || "",
        bio: user.bio || "",
        photoUrl: user.photo_url || "",
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin chi tiết người dùng",
      error: error.message,
    });
  }
});

// Update user info route
router.post(
  "/update-user-info/:username",
  upload.single("photo"),
  async (req, res) => {
    try {
      const { username } = req.params;
      const { name, birthday, gender, email, phone, bio } = req.body;

      console.log("Received update request for user:", username);
      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      // Get user_id
      const [users] = await req.dbConnection.execute(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      const userId = users[0].id;

      let photoUrl = null;
      if (req.file) {
        photoUrl = `/uploads/${req.file.filename}`;
        console.log("File uploaded successfully:", req.file.path);
      }

      // Check if personal info exists
      const [existingInfo] = await req.dbConnection.execute(
        "SELECT * FROM personal_info WHERE user_id = ?",
        [userId]
      );

      if (existingInfo.length > 0) {
        // If info exists, update it
        await req.dbConnection.execute(
          `UPDATE personal_info SET 
     phone = ?, bio = ?, photo_url = COALESCE(?, photo_url), updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
          [phone, bio, photoUrl, userId]
        );
      } else {
        // If info doesn't exist, insert new record
        await req.dbConnection.execute(
          `INSERT INTO personal_info (user_id, phone, bio, photo_url) 
     VALUES (?, ?, ?, ?)`,
          [userId, phone, bio, photoUrl]
        );
      }

      // Convert birthday to YYYY-MM-DD format
      const formattedBirthday = new Date(birthday).toISOString().split("T")[0];

      // Update user information
      await req.dbConnection.execute(
        `UPDATE users SET 
   firstName = ?, lastName = ?, birthDate = ?, gender = ?, email = ? 
   WHERE id = ?`,
        [
          name.split(" ")[0],
          name.split(" ").slice(1).join(" "),
          formattedBirthday,
          gender,
          email,
          userId,
        ]
      );

      console.log("User info updated successfully");

      res.json({
        success: true,
        message: "Thông tin đã được cập nhật thành công.",
        photoUrl: photoUrl,
      });
    } catch (error) {
      console.error("Error updating user info:", error);
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật thông tin người dùng",
        error: error.message,
      });
    }
  }
);

// Cập nhật route để lấy tất cả người dùng với thông tin cá nhân
router.get("/all-users", async (req, res) => {
  try {
    const [rows] = await req.dbConnection.execute(`
  SELECT u.id, u.username, CONCAT(u.firstName, ' ', u.lastName) AS name, 
         pi.photo_url, pi.bio, pi.phone
  FROM users u
  LEFT JOIN personal_info pi ON u.id = pi.user_id
`);
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách người dùng",
      error: error.message,
    });
  }
});

module.exports = router;
