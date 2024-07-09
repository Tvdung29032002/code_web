// Lắng nghe sự kiện submit của form đăng nhập
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Ngăn chặn hành động mặc định của form

  // Lấy giá trị của username và password từ các input
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Lấy phản hồi từ Google reCAPTCHA
  const recaptchaResponse = grecaptcha.getResponse();

  // Kiểm tra xem người dùng đã xác nhận reCAPTCHA chưa
  if (!recaptchaResponse) {
    alert("Vui lòng xác nhận bạn không phải là robot.");
    return;
  }

  // Kiểm tra đăng nhập (đây chỉ là ví dụ đơn giản, không nên lưu trữ mật khẩu như này)
  if (
    (username === "xxx" && password === "123456") ||
    (username === "dungtv" && password === "29032002") ||
    (username === "hungnk" && password === "29042002")
  ) {
    // Lưu trạng thái đăng nhập vào localStorage
    localStorage.setItem("isLoggedIn", "true");

    // Chuyển hướng đến trang chính
    window.location.href = "index.html";
  } else {
    alert("Invalid username or password");
  }
});
