const checkAdminRole = (req, res, next) => {
  const userRole = req.user.role; // Giả sử bạn đã lưu thông tin người dùng trong req.user
  if (userRole === "Admin") {
    next(); // Cho phép tiếp tục
  } else {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
};

module.exports = { checkAdminRole };
