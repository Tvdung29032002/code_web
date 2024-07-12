document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const keepLoggedIn = document.getElementById("keepLoggedIn").checked;

  const recaptchaResponse = grecaptcha.getResponse();

  if (!recaptchaResponse) {
    alert("Vui lòng xác nhận bạn không phải là robot.");
    return;
  }

  if (
    (username === "xxx" && password === "123456") ||
    (username === "dungtv" && password === "29032002") ||
    (username === "hungnk" && password === "29042002")
  ) {
    if (keepLoggedIn) {
      // Lưu thông tin đăng nhập vào localStorage nếu "Duy trì đăng nhập" được chọn
      localStorage.setItem("username", username);
      localStorage.setItem("password", password); // Lưu ý: Đây không phải là cách an toàn để lưu mật khẩu
      localStorage.setItem("isLoggedIn", "true");
    } else {
      // Xóa thông tin đăng nhập khỏi localStorage nếu không chọn "Duy trì đăng nhập"
      localStorage.removeItem("username");
      localStorage.removeItem("password");
      localStorage.removeItem("isLoggedIn");
    }

    window.location.href = "index.html";
  } else {
    alert("Sai username hoặc password");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const togglePassword = document.getElementById("togglePassword");
  const password = document.getElementById("password");

  togglePassword.addEventListener("click", function () {
    const type =
      password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);

    if (type === "password") {
      this.src = "image_login/eye-closed.png";
    } else {
      this.src = "image_login/eye-open.png";
    }
  });
});

// Kiểm tra và điền thông tin đăng nhập đã lưu (nếu có)
window.addEventListener("load", function () {
  const savedUsername = localStorage.getItem("username");
  const savedPassword = localStorage.getItem("password");
  if (savedUsername && savedPassword) {
    document.getElementById("username").value = savedUsername;
    document.getElementById("password").value = savedPassword;
    document.getElementById("keepLoggedIn").checked = true;
  }
});
var modal = document.getElementById("signupModal");
var btn = document.querySelector(".create-account");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
  modal.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const daySelect = document.getElementById("day");
  const monthSelect = document.getElementById("month");
  const yearSelect = document.getElementById("year");

  // Tạo tùy chọn cho ngày
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    daySelect.appendChild(option);
  }

  // Tạo tùy chọn cho tháng
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  months.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // Tạo tùy chọn cho năm
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 100; i--) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const signupButton = document.getElementById("signupButton");
  if (signupButton) {
    signupButton.addEventListener("click", function (e) {
      e.preventDefault();

      // Lấy giá trị từ các trường input
      const firstName = document.getElementById("firstName").value;
      const lastName = document.getElementById("lastName").value;
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const day = document.getElementById("day").value;
      const month = document.getElementById("month").value;
      const year = document.getElementById("year").value;
      const gender = document.querySelector(
        'input[name="gender"]:checked'
      )?.value;

      if (
        !firstName ||
        !lastName ||
        !username ||
        !email ||
        !password ||
        !day ||
        !month ||
        !year ||
        !gender
      ) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      const userData = {
        firstName,
        lastName,
        username,
        email,
        password,
        birthDate: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        gender,
      };

      console.log("Sending registration data:", userData);

      // Gửi dữ liệu đến server
      fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Server response:", data);
          if (data.success) {
            alert("Đăng ký thành công!");
            // Đóng modal hoặc chuyển hướng người dùng
          } else {
            alert(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
        });
    });
  } else {
    console.error("Signup button not found!");
  }
});
