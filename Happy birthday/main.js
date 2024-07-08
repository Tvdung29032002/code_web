document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("birthday-audio");
  const startButton = document.getElementById("start-button");

  startButton.addEventListener("click", function () {
    audio.play();
    startButton.style.display = "none";

    const textElement = document.querySelector(".typing-text");
    let index = 0;
    let texts = ["Phùng Lệ Diễm 09-07", "Trần Anh Thư 07-07"];
    let currentTextIndex = 0;

    function typeText() {
      const textToType = texts[currentTextIndex];
      if (index < textToType.length) {
        textElement.textContent += textToType.charAt(index);
        index++;
        setTimeout(typeText, 150);
      } else {
        blinkText(0);
      }
    }

    function blinkText(count) {
      if (count < 3) {
        textElement.classList.add("blink");
        setTimeout(function () {
          textElement.classList.remove("blink");
          blinkText(count + 1);
        }, 800);
      } else {
        setTimeout(resetText, 3000);
      }
    }

    function resetText() {
      textElement.textContent = "";
      index = 0;
      currentTextIndex = (currentTextIndex + 1) % texts.length;
      setTimeout(typeText, 1000);
    }

    typeText();

    function createBalloon() {
      const balloon = document.createElement("img");
      balloon.src = "album/bong_bay.png";
      balloon.classList.add("balloon");
      balloon.style.left = Math.random() * 100 + "vw";
      balloon.style.animationDuration = Math.random() * 5 + 5 + "s";
      document.body.appendChild(balloon);
      balloon.addEventListener("animationend", () => {
        balloon.remove();
      });
    }

    setInterval(createBalloon, 2000);
  });

  document
    .getElementById("sidebarToggle")
    .addEventListener("click", function () {
      var sidebar = document.getElementById("sidebar-menu");
      sidebar.classList.add("open");
    });

  document
    .getElementById("sidebarClose")
    .addEventListener("click", function () {
      var sidebar = document.getElementById("sidebar-menu");
      sidebar.classList.remove("open");
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const avatarIcon = document.getElementById("avatarIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");

  avatarIcon.addEventListener("click", (event) => {
    event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Đóng menu dropdown nếu người dùng click bên ngoài
  window.addEventListener("click", (event) => {
    if (
      !avatarIcon.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
    }
  });
});
