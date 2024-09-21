import { EmojiButton } from "https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js";
import { ChatAPI } from "./chat-api.js";

const ChatUI = {
  initUI: function (chatApp) {
    const sendButton = document.getElementById("sendButton");
    const messageInput = document.getElementById("messageInput");
    const newChatBtn = document.querySelector(".new-chat-btn");
    const groupChatButton = document.getElementById("groupChatButton");
    const emojiButton = document.querySelector("#emojiButton");

    if (sendButton && messageInput) {
      sendButton.addEventListener("click", () => this.sendMessage(chatApp));

      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage(chatApp);
        }
      });
    }

    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        alert("Tính năng tạo chat mới sẽ được thêm vào sau!");
      });
    }

    if (groupChatButton) {
      groupChatButton.addEventListener("click", () => {
        ChatAPI.createOrGetGroupChat(chatApp.currentUserId)
          .then((data) => {
            if (data.success) {
              this.displayGroupChatInfo(data.groupChat);
              this.loadGroupMessages(data.groupChat.id, chatApp);
            } else {
              console.error("Lỗi khi tạo hoặc lấy nhóm chat:", data.message);
            }
          })
          .catch((error) => {
            console.error("Lỗi khi tạo hoặc lấy nhóm chat:", error);
          });
      });
    }

    if (emojiButton) {
      this.initEmojiPicker();
    }
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

  renderChatList: function (users, chatApp) {
    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = "";
    users.forEach((user) => {
      const li = document.createElement("li");
      li.className = "chat-list-item";
      li.dataset.userId = user.id;
      li.innerHTML = `
        <img src="${user.photo_url || "default-avatar.png"}" alt="${user.name}">
        <div>
          <h3>${user.display_name || user.name}</h3>
          <p>${user.bio || "Không có tiểu sử"}</p>
        </div>
        <span class="online-status ${
          user.online_status ? "online" : "offline"
        }"></span>
      `;
      li.addEventListener("click", () => this.selectChat(user, chatApp));
      chatList.appendChild(li);
    });
  },

  selectChat: function (user, chatApp) {
    if (user.is_group) {
      chatApp.currentGroupId = user.id;
      chatApp.isGroupChat = true;
      this.displayGroupChatInfo(user);
      this.loadGroupMessages(user.id, chatApp);
    } else {
      chatApp.currentReceiverId = user.id;
      chatApp.isGroupChat = false;
      chatApp.currentGroupId = null;
      this.displayCurrentUserInfo(user);
      this.loadUserMessages(user.id, chatApp);
    }
  },

  updateUserOnlineStatus: function (userId, onlineStatus) {
    const userItem = document.querySelector(
      `.chat-list-item[data-user-id="${userId}"]`
    );
    if (userItem) {
      const statusDot = userItem.querySelector(".online-status");
      if (statusDot) {
        statusDot.classList.remove("online", "offline");
        statusDot.classList.add(onlineStatus ? "online" : "offline");
      }
    }

    const chatInfoStatus = document.querySelector(".chat-info .status");
    if (chatInfoStatus && chatInfoStatus.dataset.userId === userId.toString()) {
      chatInfoStatus.textContent = onlineStatus ? "Trực tuyến" : "Ngoại tuyến";
    }
  },

  addChatListEventListeners: function (users, chatApp) {
    document.querySelectorAll(".chat-list-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".edit-display-name")) {
          const groupId = item.getAttribute("data-group-id");
          const userId = item.getAttribute("data-user-id");
          if (groupId) {
            this.displayGroupChatInfo({
              id: parseInt(groupId),
              name: item.querySelector("h3").textContent,
            });
            this.loadGroupMessages(parseInt(groupId), chatApp);
          } else if (userId) {
            const user = users.find((u) => u.id.toString() === userId);
            if (user) {
              this.displayCurrentUserInfo(user);
              this.loadUserMessages(user.id, chatApp);
            }
          }
        }
      });
    });

    document.querySelectorAll(".edit-display-name").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const chatId = button.getAttribute("data-chat-id");
        const isGroup = button.getAttribute("data-is-group") === "true";
        const currentName = button
          .closest(".chat-list-item")
          .querySelector("h3").textContent;

        this.showEditDisplayNameModal(chatId, currentName, isGroup, chatApp);
      });
    });
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

  displayGroupChatInfo: function (groupChat) {
    const chatInfo = document.querySelector(".chat-info");
    chatInfo.innerHTML = `
      <img src="/uploads/group-message-default.png" alt="${groupChat.name}" class="chat-avatar">
      <div>
        <h3>${groupChat.name}</h3>
        <span class="status">Nhóm chat</span>
      </div>
    `;
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

  addMessage: function (content, isSent, senderName = "") {
    const chatMessages = document.getElementById("chatMessages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", isSent ? "sent" : "received");
    messageElement.innerHTML = `
      ${
        senderName && !isSent
          ? `<div class="sender-name">${senderName}</div>`
          : ""
      }
      <div class="message-content">${content}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  },

  updateChatListItem: function (chatId, newName, isGroup) {
    const chatItem = document.querySelector(
      `[data-${isGroup ? "group" : "user"}-id="${chatId}"]`
    );
    if (chatItem) {
      chatItem.querySelector("h3").textContent = newName;
    }
  },

  setupSearchListener: function (users, chatApp) {
    const searchInput = document.querySelector(".search-container input");
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.trim();
      const filteredUsers = this.searchUsers(users, searchTerm);
      this.renderChatList(filteredUsers, chatApp);
    });
  },

  searchUsers: function (users, searchTerm) {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },

  loadGroupMessages: function (groupId, chatApp) {
    ChatAPI.fetchGroupMessages(groupId)
      .then((data) => {
        const chatMessages = document.getElementById("chatMessages");
        chatMessages.innerHTML = "";
        data.messages.forEach((message) => {
          this.addMessage(
            message.content,
            message.sender_id == chatApp.currentUserId,
            message.sender_name
          );
        });
        chatApp.currentGroupId = groupId;
        chatApp.isGroupChat = true;
        chatApp.currentReceiverId = null;
      })
      .catch((error) => {
        console.error("Lỗi khi tải tin nhắn nhóm:", error);
      });
  },

  loadUserMessages: function (userId, chatApp) {
    ChatAPI.fetchUserMessages(chatApp.currentUserId, userId)
      .then((data) => {
        const chatMessages = document.getElementById("chatMessages");
        chatMessages.innerHTML = "";
        data.messages.forEach((message) => {
          this.addMessage(
            message.content,
            message.sender_id == chatApp.currentUserId,
            message.sender_id == chatApp.currentUserId
              ? "Bạn"
              : message.sender_name
          );
        });
        chatApp.currentReceiverId = userId;
        chatApp.isGroupChat = false;
        chatApp.currentGroupId = null;
      })
      .catch((error) => {
        console.error("Lỗi khi tải tin nhắn:", error);
      });
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

  setupMessageSendListener: function (chatApp) {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");

    const sendMessage = () => {
      const content = messageInput.value.trim();
      if (content) {
        if (chatApp.isGroupChat) {
          chatApp
            .sendGroupMessage(chatApp.currentGroupId, content)
            .then(() => {
              this.addMessage(content, true);
              messageInput.value = "";
            })
            .catch((error) =>
              console.error("Lỗi khi gửi tin nhắn nhóm:", error)
            );
        } else {
          chatApp
            .sendMessage(chatApp.currentReceiverId, content)
            .then(() => {
              this.addMessage(content, true);
              messageInput.value = "";
            })
            .catch((error) => console.error("Lỗi khi gửi tin nhắn:", error));
        }
      }
    };

    sendButton.addEventListener("click", sendMessage);

    messageInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  },

  sendMessage: function (chatApp) {
    const messageInput = document.getElementById("messageInput");
    const content = messageInput.value.trim();
    if (content) {
      if (chatApp.isGroupChat) {
        chatApp
          .sendGroupMessage(chatApp.currentGroupId, content)
          .then(() => {
            this.addMessage(content, true);
            messageInput.value = "";
          })
          .catch((error) => console.error("Lỗi khi gửi tin nhắn nhóm:", error));
      } else {
        chatApp
          .sendMessage(chatApp.currentReceiverId, content)
          .then(() => {
            this.addMessage(content, true);
            messageInput.value = "";
          })
          .catch((error) =>
            console.error("Lỗi khi gửi tin nhắn cá nhân:", error)
          );
      }
    }
  },
};

export { ChatUI };
