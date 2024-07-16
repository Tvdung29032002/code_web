document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const keepLoggedIn = document.getElementById("keepLoggedIn").checked;

  console.log("Username being sent:", username);
  console.log("Attempting login for username:", username);
  console.log("Keep logged in:", keepLoggedIn);

  const recaptchaResponse = grecaptcha.getResponse();

  if (!recaptchaResponse) {
    console.log("reCAPTCHA not completed");
    alert("Vui lòng xác nhận bạn không phải là robot.");
    return;
  }

  console.log("Sending login request to server...");

  fetch("http://192.168.0.103:3000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => {
      console.log("Received response from server");
      return response.json();
    })
    .then((data) => {
      console.log("Server response:", data);
      if (data.success) {
        console.log("Login successful");
        if (keepLoggedIn) {
          console.log("Saving login info to localStorage");
          localStorage.setItem("username", username);
          localStorage.setItem("isLoggedIn", "true");
        } else {
          console.log("Removing login info from localStorage");
          localStorage.removeItem("username");
          localStorage.removeItem("isLoggedIn");
        }

        window.location.href = "index.html";
      } else {
        console.log("Login failed:", data.message);
        alert(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    })
    .catch((error) => {
      console.error("Error during login:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
    });
});

// Xử lý hiển thị/ẩn mật khẩu
document.addEventListener("DOMContentLoaded", function () {
  const togglePassword = document.getElementById("togglePassword");
  const password = document.getElementById("loginPassword");

  if (togglePassword && password) {
    togglePassword.addEventListener("click", function () {
      const type =
        password.getAttribute("type") === "password" ? "text" : "password";
      password.setAttribute("type", type);
      this.src =
        type === "password"
          ? "image_login/eye-closed.png"
          : "image_login/eye-open.png";
    });
  }
});

// Xử lý lưu thông tin đăng nhập
window.addEventListener("load", function () {
  const savedUsername = localStorage.getItem("username");
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (savedUsername && isLoggedIn === "true") {
    document.getElementById("loginUsername").value = savedUsername;
    document.getElementById("keepLoggedIn").checked = true;
  }
});

// Xử lý modal đăng ký
var modal = document.getElementById("signupModal");
var btn = document.querySelector(".create-account");
var span = document.getElementsByClassName("close")[0];

if (btn) {
  btn.onclick = function () {
    modal.style.display = "block";
  };
}

if (span) {
  span.onclick = function () {
    modal.style.display = "none";
  };
}

// Xử lý các select cho ngày sinh
document.addEventListener("DOMContentLoaded", function () {
  const daySelect = document.getElementById("day");
  const monthSelect = document.getElementById("month");
  const yearSelect = document.getElementById("year");

  if (daySelect) {
    for (let i = 1; i <= 31; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      daySelect.appendChild(option);
    }
  }

  if (monthSelect) {
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
  }

  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 100; i--) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      yearSelect.appendChild(option);
    }
  }
});

// Xử lý đăng ký
function isValidEmail(email) {
  // Biểu thức chính quy để kiểm tra email có đuôi @gmail.com
  const emailRegex = /^[^\s@]+@gmail\.com$/i;
  return emailRegex.test(email);
}

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const firstName =
        document.getElementById("firstName")?.value.trim() || "";
      const lastName = document.getElementById("lastName")?.value.trim() || "";
      const username =
        document.getElementById("signupUsername")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || "";
      const password = document.getElementById("signupPassword")?.value || "";
      const day = document.getElementById("day")?.value || "";
      const month = document.getElementById("month")?.value || "";
      const year = document.getElementById("year")?.value || "";
      const gender =
        document.querySelector('input[name="gender"]:checked')?.value || "";

      console.log("Form data:", {
        firstName,
        lastName,
        username,
        email,
        password,
        day,
        month,
        year,
        gender,
      });

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
        console.log("Missing information detected");
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Vui lòng nhập lại địa chỉ Email hợp lệ.");
        return;
      }

      const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      const userData = {
        firstName,
        lastName,
        username,
        email,
        password,
        birthDate,
        gender,
      };

      console.log("Sending registration data:", userData);

      fetch("http://192.168.0.103:3000/api/register", {
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
            modal.style.display = "none"; // Đóng modal sau khi đăng ký thành công
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
    console.error("Signup form not found!");
  }
});
