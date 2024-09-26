import { EmojiButton } from "https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js";
import { ChatAPI } from "./chat-api.js";
import { ChatEvents } from "./chat-events.js";

const ChatUI = {
  lastMessageDate: null,

  renderChatList: function (users, chatApp) {
    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = "";
    users.forEach((user) => {
      const li = document.createElement("li");
      li.className = "chat-list-item";
      if (user.is_group) {
        li.dataset.groupId = user.id;
      } else {
        li.dataset.userId = user.id;
      }
      li.innerHTML = `
        <img src="${
          user.photo_url ||
          (user.is_group ? "group-avatar.png" : "default-avatar.png")
        }" alt="${user.name}">
        <div>
          <h3>${user.display_name || user.name}</h3>
          <p>${
            user.bio || (user.is_group ? "Nhóm chat" : "Không có tiểu sử")
          }</p>
        </div>
        <span class="online-status ${
          user.online_status ? "online" : "offline"
        }"></span>
      `;
      li.addEventListener("click", () => ChatEvents.selectChat(user, chatApp));
      chatList.appendChild(li);
    });
  },

  updateUserOnlineStatus: function (userId, onlineStatus) {
    const userItem = document.querySelector(
      `.chat-list-item[data-user-id="${userId}"]`
    );
    if (userItem) {
      const statusDot = userItem.querySelector(".online-status");
      if (statusDot) {
        statusDot.classList.toggle("online", onlineStatus);
        statusDot.classList.toggle("offline", !onlineStatus);
      }
    }

    const chatInfoStatus = document.querySelector(".chat-info .status");
    if (chatInfoStatus && chatInfoStatus.dataset.userId === userId.toString()) {
      chatInfoStatus.textContent = onlineStatus ? "Trực tuyến" : "Ngoại tuyến";
    }
  },

  displayGroupChatInfo: function (groupChat, chatApp) {
    const chatInfo = document.querySelector(".chat-info");
    chatInfo.innerHTML = `
      <img src="${
        groupChat.photo_url || "/uploads/group-message-default.png"
      }" alt="${groupChat.name}" class="chat-avatar">


      <div>
        <h3>${groupChat.name}</h3>
        <span class="status" data-group-id="${groupChat.id}">
          <span class="status-text">Đang cập nhật...</span>
        </span>
      </div>
    `;

    if (chatApp && chatApp.currentUserId) {
      this.updateGroupOnlineStatus(groupChat.id, chatApp.currentUserId);
    } else {
      console.warn(
        "chatApp hoặc currentUserId không được định nghĩa trong displayGroupChatInfo"
      );
    }
  },

  displayCurrentUserInfo: function (user) {
    const chatInfo = document.querySelector(".chat-info");
    chatInfo.innerHTML = `
      <img src="${user.photo_url || "/uploads/default.jpg"}" alt="${
      user.name
    }" class="chat-avatar">
      <div>
        <h3>${user.display_name || user.name}</h3>
        <span class="status" data-user-id="${user.id}">Đang cập nhật...</span>
      </div>
    `;
    ChatAPI.getOnlineStatus(user.id)
      .then((onlineStatus) => {
        this.updateUserOnlineStatus(user.id, onlineStatus);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy trạng thái trực tuyến:", error);
      });
  },

  addMessage: function (
    content,
    isSent,
    senderName = "",
    isSeen = false,
    timestamp
  ) {
    const chatMessages = document.getElementById("chatMessages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", isSent ? "sent" : "received");

    const messageDate = new Date(timestamp);
    const formattedDate = this.formatMessageDate(messageDate);
    const formattedTime = this.formatMessageTime(messageDate);

    let dateHeader = "";
    if (formattedDate !== this.lastMessageDate) {
      dateHeader = `<div class="message-date-header">${formattedDate}</div>`;
      this.lastMessageDate = formattedDate;
    }

    messageElement.innerHTML = `
      ${dateHeader}
      ${
        senderName && !isSent
          ? `<div class="sender-name">${senderName}</div>`
          : ""
      }
      <div class="message-content">${content}</div>
      <div class="message-info">
        <span class="message-time">${formattedTime}</span>
        ${
          isSent
            ? `<span class="message-status">${
                isSeen ? "Đã xem" : "Đã gửi"
              }</span>`
            : ""
        }
      </div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  },

  formatMessageDate: function (date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      return date.toLocaleDateString("vi-VN", options);
    }
  },

  formatMessageTime: function (date) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "CH" : "SA";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  },

  updateMessageStatus: function (messageId, isSeen) {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (messageElement) {
      const statusElement = messageElement.querySelector(".message-status");
      if (statusElement) {
        statusElement.textContent = isSeen ? "Đã xem" : "Đã gửi";
        statusElement.classList.toggle("seen", isSeen);
      }
    }
  },

  updateChatListItem: function (chatId, newName, isGroup) {
    const chatItem = document.querySelector(
      `[data-${isGroup ? "group" : "user"}-id="${chatId}"]`
    );
    if (chatItem) {
      chatItem.querySelector("h3").textContent = newName;
    }
  },

  searchUsers: function (users, searchTerm) {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },

  updateChatListWithNewMessage: function (message, isGroupMessage, chatApp) {
    const chatList = document.getElementById("chat-list");
    if (!chatList) {
      return;
    }

    let chatItem;
    if (isGroupMessage) {
      chatItem = chatList.querySelector(
        `[data-group-id="${message.group_id}"]`
      );
    } else {
      const otherUserId =
        message.sender_id === chatApp.currentUserId
          ? message.receiver_id
          : message.sender_id;
      chatItem = chatList.querySelector(`[data-user-id="${otherUserId}"]`);
    }

    if (chatItem) {
      chatList.insertBefore(chatItem, chatList.firstChild);

      const previewElement = chatItem.querySelector("p");
      if (previewElement) {
        previewElement.textContent =
          message.content.substring(0, 30) +
          (message.content.length > 30 ? "..." : "");
      }

      if (!chatItem.classList.contains("active")) {
        chatItem.classList.add("new-message");
      }
    }
  },

  showEditDisplayNameModal: function (chatId, currentName, isGroup, chatApp) {
    const modal = document.getElementById("displayNameModal");
    const modalInput = document.getElementById("newDisplayName");
    modalInput.value = currentName;
    modal.style.display = "block";

    const saveButton = document.getElementById("saveDisplayNameBtn");
    saveButton.onclick = () => {
      const newName = modalInput.value.trim();
      if (newName && newName !== currentName) {
        chatApp.updateChatDisplayName(chatId, newName, isGroup);
        modal.style.display = "none";
      }
    };

    const closeButton = document.querySelector(".modal .close");
    closeButton.onclick = () => {
      modal.style.display = "none";
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  },

  initEmojiPicker: function () {
    const emojiButton = document.querySelector("#emojiButton");
    const picker = new EmojiButton();

    picker.on("emoji", (selection) => {
      const messageInput = document.getElementById("messageInput");
      messageInput.value += selection.emoji;
      messageInput.focus();
    });

    emojiButton.addEventListener("click", () => {
      picker.togglePicker(emojiButton);
    });
  },

  updateGroupOnlineStatus: function (groupId, currentUserId) {
    if (!currentUserId) {
      console.error("currentUserId is missing in updateGroupOnlineStatus");
      return;
    }
    ChatAPI.getGroupOnlineStatus(groupId, currentUserId)
      .then((onlineUsers) => {
        const isAnyoneOnline = onlineUsers.length > 0;

        // Cập nhật trạng thái trong danh sách chat
        const groupItem = document.querySelector(
          `.chat-list-item[data-group-id="${groupId}"]`
        );
        if (groupItem) {
          const statusDot = groupItem.querySelector(".online-status");
          if (statusDot) {
            statusDot.classList.remove("online", "offline");
            statusDot.classList.add(isAnyoneOnline ? "online" : "offline");
          }
        }

        // Cập nhật trạng thái trong phần thông tin chat
        const chatInfoStatus = document.querySelector(`.chat-info .status`);
        if (
          chatInfoStatus &&
          chatInfoStatus.dataset.groupId === groupId.toString()
        ) {
          const statusText = chatInfoStatus.querySelector(".status-text");
          if (statusText) {
            statusText.textContent = isAnyoneOnline
              ? "Trực tuyến"
              : "Ngoại tuyến";
          }

          const statusDot = chatInfoStatus.querySelector(".online-status");
          if (statusDot) {
            statusDot.classList.remove("online", "offline");
            statusDot.classList.add(isAnyoneOnline ? "online" : "offline");
          }
        }
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật trạng thái online của nhóm:", error);
      });
  },

  updateLastMessageStatus: function (status) {
    const chatMessages = document.getElementById("chatMessages");
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage) {
      const statusElement = lastMessage.querySelector(".message-status");
      if (statusElement) {
        statusElement.textContent = status;
      }
    }
  },

  showErrorMessage: function (message) {
    const chatMessages = document.getElementById("chatMessages");
    const errorElement = document.createElement("div");
    errorElement.classList.add("error-message");
    errorElement.textContent = message;
    chatMessages.appendChild(errorElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  },

  resetLastMessageDate: function () {
    this.lastMessageDate = null;
  },
};

export { ChatUI };
