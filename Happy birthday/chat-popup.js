import { ChatAPI } from "./messenger/chat-api.js";
import { ChatApp } from "./messenger/chat-app.js";

let activeChats = [];

export function initChatPopup() {
  // Thêm sự kiện lắng nghe cho biểu tượng messenger
  const messengerIcon = document.getElementById("messengerIcon");
  messengerIcon.addEventListener("click", () => {
    toggleMessengerMenu();
  });

  // Thêm sự kiện lắng nghe cho nút "Tin nhắn mới"
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("new-message-btn")) {
      window.location.href = "messenger/chat.html";
    }
  });
}

function toggleMessengerMenu() {
  const messengerMenu = document.getElementById("messengerMenu");
  if (
    messengerMenu.style.display === "none" ||
    messengerMenu.style.display === ""
  ) {
    ChatAPI.fetchAllUsers(ChatApp.currentUserId)
      .then((users) => {
        displayMessengerMenu(users);
        messengerMenu.style.display = "block";
      })
      .catch((error) => {
        console.error("Lỗi khi tải danh sách người dùng:", error);
      });
  } else {
    messengerMenu.style.display = "none";
  }
}

function displayMessengerMenu(users) {
  const messengerMenu = document.getElementById("messengerMenu");
  messengerMenu.innerHTML = `
    <div class="messenger-header">
      <span class="messenger-title">Tin nhắn</span>
      <a href="messenger/chat.html" class="new-message-btn">Tin nhắn mới</a>
    </div>
    <ul class="messenger-list">
      ${users
        .map(
          (user) => `
        <li class="messenger-item" data-user-id="${user.id}">
          <img src="${user.photo_url || "album/default-avatar.png"}" alt="${
            user.name
          }" class="messenger-avatar">
          <div class="messenger-content">
            <div class="messenger-name">${user.display_name || user.name}</div>
            <div class="messenger-preview">
              ${
                user.is_group
                  ? "Nhóm chat"
                  : user.online_status
                  ? "Đang hoạt động"
                  : "Không hoạt động"
              }
            </div>
          </div>
          ${
            user.online_status && !user.is_group
              ? '<div class="online-indicator"></div>'
              : ""
          }
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  // Thêm sự kiện cho các mục người dùng
  const userItems = messengerMenu.querySelectorAll(".messenger-item");
  userItems.forEach((item) => {
    item.addEventListener("click", () => {
      const userId = item.dataset.userId;
      const user = users.find((u) => u.id == userId);
      if (user) {
        openChatPopup(user);
      }
    });
  });
}

export function openChatPopup(user) {
  if (activeChats.find((chat) => chat.id === user.id)) {
    return; // Nếu chat đã mở, không làm gì cả
  }

  const popupId = `chat-popup-${user.id}`;
  const popupHtml = `
    <div id="${popupId}" class="chat-popup" data-user-id="${user.id}">
      <div class="chat-header">
        <span>${user.name}</span>
        <span class="close-chat">&times;</span>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <input type="text" id="messageInput-${user.id}" placeholder="Nhập tin nhắn...">
      </div>
    </div>
  `;

  const chatPopupsContainer = document.getElementById("chat-popups-container");
  if (!chatPopupsContainer) {
    console.error("Không tìm thấy phần tử chat-popups-container");
    return;
  }

  chatPopupsContainer.insertAdjacentHTML("afterbegin", popupHtml);

  const popup = document.getElementById(popupId);
  if (!popup) {
    console.error(`Không tìm thấy phần tử chat popup với id ${popupId}`);
    return;
  }

  const closeBtn = popup.querySelector(".close-chat");
  const input = popup.querySelector(`#messageInput-${user.id}`);
  const messagesContainer = popup.querySelector(".chat-messages");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.remove();
      activeChats = activeChats.filter((chat) => chat.id !== user.id);
    });
  }

  // Thêm sự kiện cho input
  if (input) {
    input.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        const content = input.value.trim();
        if (content) {
          sendMessage(user.id, content, input);
        }
      }
    });
  } else {
    console.error(`Không tìm thấy phần tử input tin nhắn cho user ${user.id}`);
  }

  activeChats.push(user);

  // Tải tin nhắn cũ
  loadMessages(user.id);
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
    // Nếu chat chưa mở, có thể hiển thị thông báo hoặc mở chat mới
    console.log("Tin nhắn mới từ người dùng chưa mở chat:", message);
  }
}
