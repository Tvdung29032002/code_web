import { EmojiButton } from "https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js";
import { ChatAPI } from "./messenger/chat-api.js";
import { ChatApp } from "./messenger/chat-app.js";
import { displayMessengerMenu } from "./ui.js";

let activeChats = [];

function closeAllMenus() {
  const menus = document.querySelectorAll(
    ".help-menu, .notification-menu, .settings-menu, .apps-menu, .dropdown-menu, .messenger-menu"
  );
  menus.forEach((menu) => {
    menu.classList.remove("show");
    const tooltipContainer = menu.closest(".tooltip-container");
    if (tooltipContainer) {
      tooltipContainer.classList.remove("menu-open");
    }
  });
}

export function initChatPopup() {
  // Thêm template và container vào DOM
  fetch("chat-popup.html")
    .then((response) => response.text())
    .then((html) => {
      document.body.insertAdjacentHTML("beforeend", html);
      // Tiếp tục với phần còn lại của hàm initChatPopup
      const messengerIcon = document.getElementById("messengerIcon");
      const messengerMenu = document.getElementById("messengerMenu");
      const tooltipContainer = messengerIcon.closest(".tooltip-container");

      messengerIcon.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMessengerMenu(tooltipContainer);
      });

      document.addEventListener("click", (event) => {
        if (
          !messengerMenu.contains(event.target) &&
          event.target !== messengerIcon
        ) {
          closeMessengerMenu(tooltipContainer);
        }
      });

      // Thêm sự kiện lắng nghe cho các icon khác
      const otherIcons = document.querySelectorAll(
        "#helpIcon, #notificationIcon, #settingsIcon, #appsIcon, #avatarIcon"
      );
      otherIcons.forEach((icon) => {
        icon.addEventListener("click", () => {
          closeMessengerMenu(tooltipContainer);
        });
      });

      // Thêm sự kiện lắng nghe cho nút "Tin nhắn mới"
      document.addEventListener("click", function (event) {
        if (event.target.classList.contains("new-message-btn")) {
          window.location.href = "/messenger/chat.html";
        }
      });
    });
}

function toggleMessengerMenu(tooltipContainer) {
  const messengerMenu = document.getElementById("messengerMenu");

  if (messengerMenu.classList.contains("show")) {
    closeMessengerMenu(tooltipContainer);
  } else {
    closeAllMenus(); // Đóng tất cả các menu khác
    openMessengerMenu(tooltipContainer);
  }
}

function openMessengerMenu(tooltipContainer) {
  const messengerMenu = document.getElementById("messengerMenu");
  ChatAPI.fetchAllUsers(ChatApp.currentUserId)
    .then((users) => {
      displayMessengerMenu(users); // Gọi hàm từ ui.js
      messengerMenu.classList.add("show");
      tooltipContainer.classList.add("menu-open");
    })
    .catch((error) => {
      console.error("Lỗi khi tải danh sách người dùng:", error);
    });
}

function closeMessengerMenu(tooltipContainer) {
  const messengerMenu = document.getElementById("messengerMenu");
  messengerMenu.classList.remove("show");
  tooltipContainer.classList.remove("menu-open");
}

export function openChatPopup(user) {
  let existingChat = activeChats.find((chat) => chat.id === user.id);
  if (existingChat) {
    maximizeChatPopup(existingChat.popup);
    return;
  }

  const template = document.querySelector("#chat-popup-template");
  const chatPopup = template.content.cloneNode(true).firstElementChild;

  chatPopup.setAttribute("id", `chat-popup-${user.id}`);
  chatPopup.setAttribute("data-user-id", user.id);
  chatPopup.querySelector(".user-name").textContent = user.name;

  // Đặt ảnh đại diện
  const avatarImg = chatPopup.querySelector(".user-avatar");
  avatarImg.src = user.photo_url || "/uploads/default.jpg";
  avatarImg.alt = user.name;

  chatPopup
    .querySelector(".chat-input input")
    .setAttribute("id", `messageInput-${user.id}`);

  const chatPopupsContainer = document.getElementById("chat-popups-container");
  chatPopupsContainer.appendChild(chatPopup);

  const closeBtn = chatPopup.querySelector(".close-chat");
  const minimizeBtn = chatPopup.querySelector(".minimize-chat");
  const chatHeader = chatPopup.querySelector(".chat-header");

  closeBtn.addEventListener("click", () => closeChatPopup(chatPopup));
  minimizeBtn.addEventListener("click", () => toggleChatPopup(chatPopup));
  chatHeader.addEventListener("click", (event) => {
    if (
      chatPopup.classList.contains("minimized") &&
      !closeBtn.contains(event.target) &&
      !minimizeBtn.contains(event.target)
    ) {
      toggleChatPopup(chatPopup);
    }
  });

  const emojiButton = chatPopup.querySelector(".emoji-button");
  const messageInput = chatPopup.querySelector(".chat-input input");
  const sendButton = chatPopup.querySelector(".send-button");

  // Thêm sự kiện cho nút emoji
  if (emojiButton) {
    const picker = new EmojiButton({
      position: "top-start",
      rootElement: chatPopup,
      autoHide: false,
      autoFocusSearch: false,
    });

    picker.on("emoji", (selection) => {
      messageInput.value += selection.emoji;
      messageInput.focus();
    });

    emojiButton.addEventListener("click", () => {
      picker.togglePicker(emojiButton);
    });
  }

  // Thêm sự kiện cho nút gửi
  if (sendButton) {
    sendButton.addEventListener("click", () => {
      const content = messageInput.value.trim();
      if (content) {
        sendMessage(user.id, content, messageInput);
      }
    });
  }

  // Thêm sự kiện cho input khi nhấn Enter
  if (messageInput) {
    messageInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const content = messageInput.value.trim();
        if (content) {
          sendMessage(user.id, content, messageInput);
        }
      }
    });
  }

  // ... rest of the function ...

  activeChats.push({ id: user.id, popup: chatPopup });
  rearrangeChats();
}

function maximizeChatPopup(chatPopup) {
  if (chatPopup.classList.contains("minimized")) {
    toggleChatPopup(chatPopup);
  }
}

function toggleChatPopup(chatPopup) {
  chatPopup.classList.toggle("minimized");
  const minimizeBtn = chatPopup.querySelector(".minimize-chat i");
  const chatMessages = chatPopup.querySelector(".chat-messages");
  const chatInput = chatPopup.querySelector(".chat-input");

  if (chatPopup.classList.contains("minimized")) {
    minimizeBtn.classList.remove("fa-minus");
    minimizeBtn.classList.add("fa-expand");
    chatMessages.style.display = "none";
    chatInput.style.display = "none";
  } else {
    minimizeBtn.classList.remove("fa-expand");
    minimizeBtn.classList.add("fa-minus");
    chatMessages.style.display = "block";
    chatInput.style.display = "flex";
  }
  rearrangeChats();
}

function closeChatPopup(chatPopup) {
  const userId = chatPopup.getAttribute("data-user-id");
  activeChats = activeChats.filter((chat) => chat.id !== userId);
  chatPopup.remove();
  rearrangeChats();
}

function rearrangeChats() {
  const container = document.getElementById("chat-popups-container");
  const chats = Array.from(container.children);

  chats.sort((a, b) => {
    const aMinimized = a.classList.contains("minimized");
    const bMinimized = b.classList.contains("minimized");
    return aMinimized - bMinimized;
  });

  container.innerHTML = "";
  chats.forEach((chat) => container.appendChild(chat));
}

// Thêm hàm sendMessage mới
function sendMessage(userId, content, inputElement) {
  ChatApp.sendMessage(userId, content)
    .then(() => {
      inputElement.value = "";
      // Thêm tin nhắn vào giao diện người dùng
      const messagesContainer = document.querySelector(
        `#chat-popup-${userId} .chat-messages`
      );
      if (messagesContainer) {
        messagesContainer.insertAdjacentHTML(
          "beforeend",
          `
          <div class="chat-message sent">
            ${content}
          </div>
        `
        );
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    })
    .catch((error) => {
      console.error("Lỗi khi gửi tin nhắn:", error);
      alert("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.");
    });
}

function loadMessages(userId) {
  ChatAPI.fetchUserMessages(ChatApp.currentUserId, userId)
    .then((data) => {
      if (data.success) {
        const messagesContainer = document.querySelector(
          `#chat-popup-${userId} .chat-messages`
        );
        messagesContainer.innerHTML = "";
        data.messages.forEach((message) => {
          const isCurrentUser = message.sender_id == ChatApp.currentUserId;
          messagesContainer.insertAdjacentHTML(
            "beforeend",
            `
            <div class="chat-message ${isCurrentUser ? "sent" : "received"}">
              ${message.content}
            </div>
          `
          );
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        console.error("Lỗi khi tải tin nhắn:", data.message);
      }
    })
    .catch((error) => {
      console.error("Lỗi khi tải tin nhắn:", error);
    });
}

export function handleNewMessageHomepage(message) {
  const activeChat = activeChats.find((chat) => chat.id == message.sender_id);
  if (activeChat) {
    const popupId = `chat-popup-${activeChat.id}`;
    const messagesContainer = document.querySelector(
      `#${popupId} .chat-messages`
    );
    if (messagesContainer) {
      const isCurrentUser = message.sender_id == ChatApp.currentUserId;
      messagesContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="chat-message ${isCurrentUser ? "sent" : "received"}">
          ${message.content}
        </div>
      `
      );
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  } else {
    // Có thể thêm logic để hiển thị thông báo cho người dùng về tin nhắn mới
  }
}
