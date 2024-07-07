document.addEventListener("DOMContentLoaded", function () {
  const keyboardIcon = document.getElementById("keyboardIcon");
  const virtualKeyboard = document.getElementById("virtual-keyboard");
  const searchInput = document.getElementById("searchInput");

  if (keyboardIcon && virtualKeyboard && searchInput) {
    keyboardIcon.addEventListener("click", function () {
      if (virtualKeyboard.style.display === "none") {
        virtualKeyboard.style.display = "block";
      } else {
        virtualKeyboard.style.display = "none";
      }
    });

    virtualKeyboard.onload = function () {
      let isShiftActive = false;

      virtualKeyboard.contentWindow.document
        .querySelectorAll(".key")
        .forEach((key) => {
          key.addEventListener("click", function () {
            let keyValue = this.textContent.trim();

            if (keyValue === "⌫") {
              searchInput.value = searchInput.value.slice(0, -1);
            } else if (keyValue === "⇧") {
              isShiftActive = !isShiftActive;
              // Toggle uppercase/lowercase for all keys
              virtualKeyboard.contentWindow.document
                .querySelectorAll(".key:not(.space)")
                .forEach((key) => {
                  if (isShiftActive) {
                    key.textContent = key.textContent.toUpperCase();
                  } else {
                    key.textContent = key.textContent.toLowerCase();
                  }
                });
            } else if (keyValue === "Space") {
              searchInput.value += " "; // Add a space to the searchInput
            } else {
              if (isShiftActive) {
                keyValue = keyValue.toUpperCase();
                isShiftActive = false;
                // Reset all keys to lowercase
                virtualKeyboard.contentWindow.document
                  .querySelectorAll(".key:not(.space)")
                  .forEach((key) => {
                    key.textContent = key.textContent.toLowerCase();
                  });
              }
              searchInput.value += keyValue;
            }
          });
        });
    };
  } else {
    console.error(
      "Không tìm thấy phần tử keyboardIcon hoặc virtual-keyboard hoặc searchInput"
    );
  }
});
