// Đợi cho tài liệu HTML được tải xong trước khi thực thi mã JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Lấy tham chiếu đến đối tượng âm thanh sinh nhật
  const audio = document.getElementById("birthday-audio");
  // Lấy tham chiếu đến nút "Start"
  const startButton = document.getElementById("start-button");

  // Xử lý sự kiện khi nút "Start" được nhấn
  startButton.addEventListener("click", function () {
    // Phát âm thanh sinh nhật
    audio.play();
    // Ẩn nút "Start"
    startButton.style.display = "none";

    // Lấy tham chiếu đến vùng hiển thị chữ typing
    const textElement = document.querySelector(".typing-text");
    // Khởi tạo các biến cần thiết cho hiệu ứng typing
    let index = 0;
    let texts = ["Phùng Lệ Diễm 09-07", "Trần Anh Thư 07-07"];
    let currentTextIndex = 0;

    // Hàm hiển thị chữ từng ký tự một
    function typeText() {
      // Lấy chuỗi cần hiển thị
      const textToType = texts[currentTextIndex];
      // Nếu chưa hiển thị hết chuỗi
      if (index < textToType.length) {
        // Thêm ký tự vào vùng hiển thị
        textElement.textContent += textToType.charAt(index);
        // Tăng chỉ số để lấy ký tự tiếp theo
        index++;
        // Đặt lại hàm typeText sau 150ms
        setTimeout(typeText, 150); // Kéo dài thời gian hiển thị chữ
      } else {
        // Nếu đã hiển thị hết chuỗi, bắt đầu hiệu ứng nhấp nháy
        blinkText(0);
      }
    }

    // Hàm hiệu ứng nhấp nháy vùng hiển thị chữ
    function blinkText(count) {
      // Nếu đã nhấp nháy đủ 3 lần
      if (count < 3) {
        // Thêm lớp blink để nhấp nháy
        textElement.classList.add("blink");
        // Sau 800ms, loại bỏ lớp blink để dừng nhấp nháy
        setTimeout(function () {
          textElement.classList.remove("blink");
          // Gọi lại hàm blinkText để nhấp nháy tiếp
          blinkText(count + 1);
        }, 800);
      } else {
        // Sau khi nhấp nháy đủ số lần, đặt lại vùng hiển thị chữ
        setTimeout(resetText, 3000); // Kéo dài thời gian giữa các chuỗi
      }
    }

    // Hàm đặt lại vùng hiển thị chữ
    function resetText() {
      // Xóa nội dung hiện tại của vùng hiển thị chữ
      textElement.textContent = "";
      // Đặt lại chỉ số index về 0 để hiển thị chuỗi mới
      index = 0;
      // Chuyển sang chuỗi tiếp theo trong mảng texts
      currentTextIndex = (currentTextIndex + 1) % texts.length;
      // Gọi lại hàm typeText để hiển thị chuỗi mới
      setTimeout(typeText, 1000); // Kéo dài thời gian hiển thị chuỗi mới
    }

    // Bắt đầu hiển thị chuỗi đầu tiên khi nhấn vào nút "Start"
    typeText();

    // Hàm tạo bóng bay
    function createBalloon() {
      // Tạo một thẻ <img> mới cho bóng bay
      const balloon = document.createElement("img");
      // Đặt đường dẫn ảnh bóng bay
      balloon.src = "album/bong_bay.png";
      // Thêm lớp .balloon cho phần tử <img>
      balloon.classList.add("balloon");
      // Đặt vị trí ngang ngẫu nhiên của bóng bay
      balloon.style.left = Math.random() * 100 + "vw";
      // Đặt thời gian di chuyển ngẫu nhiên từ 5s đến 10s
      balloon.style.animationDuration = Math.random() * 5 + 5 + "s";
      // Thêm bóng bay vào trong tài liệu
      document.body.appendChild(balloon);

      // Xóa bóng bay sau khi hoàn thành chuyển động để tránh rò rỉ bộ nhớ
      balloon.addEventListener("animationend", () => {
        balloon.remove();
      });
    }

    // Tạo bóng bay mới mỗi 2 giây
    setInterval(createBalloon, 2000);
  });
});

// Hàm toggleSidebar để mở và đóng sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar-menu");
  const sidebarToggle = document.getElementById("sidebarToggle");
  if (sidebar.style.width === "250px") {
    sidebar.style.width = "0";
    sidebarToggle.src = "album/sidebar_open.png";
  } else {
    sidebar.style.width = "250px";
    sidebarToggle.src = "album/sidebar_close.png";
  }
}

// Thêm các event listener mới
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", toggleSidebar);
  document
    .getElementById("sidebarClose")
    .addEventListener("click", toggleSidebar);
});
