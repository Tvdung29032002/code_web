import { ChatAPI } from "./chat-api.js";
import { ChatUI } from "./chat-ui.js";

const ChatEvents = {
  initUI: function (chatApp) {
    const sendButton = document.getElementById("sendButton");
    const messageInput = document.getElementById("messageInput");
    const newChatBtn = document.querySelector(".new-chat-btn");
    const groupChatButton = document.getElementById("groupChatButton");
    const emojiButton = document.querySelector("#emojiButton");

    if (sendButton && messageInput) {
      const sendMessageHandler = () => {
        const content = messageInput.value.trim();
        if (content) {
          if (chatApp.isGroupChat) {
            this.sendGroupMessage(chatApp, content);
          } else {
            this.sendUserMessage(chatApp, content);
          }
          messageInput.value = "";
        }
      };

      sendButton.addEventListener("click", sendMessageHandler);

      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessageHandler();
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
        this.handleGroupChatButtonClick(chatApp);
      });
    }

    if (emojiButton) {
      ChatUI.initEmojiPicker();
    }

    this.setupSearchListener(chatApp);
    this.setupMessageSendListener(chatApp);
  },

  handleGroupChatButtonClick: function (chatApp) {
    ChatAPI.createOrGetGroupChat(chatApp.currentUserId)
      .then((data) => {
        if (data.success) {
          ChatUI.displayGroupChatInfo(data.groupChat);
          this.loadGroupMessages(data.groupChat.id, chatApp);
        } else {
          console.error("Lỗi khi tạo hoặc lấy nhóm chat:", data.message);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tạo hoặc lấy nhóm chat:", error);
      });
  },

  selectChat: function (user, chatApp) {
    if (user.is_group) {
      chatApp.currentGroupId = user.id;
      chatApp.isGroupChat = true;
      ChatUI.displayGroupChatInfo(user, chatApp);
      this.loadGroupMessages(user.id, chatApp);
      ChatAPI.markMessagesAsSeen(chatApp.currentUserId, null, user.id).then(
        (response) => {
          if (response.success && response.updatedMessageIds.length > 0) {
            chatApp.socket.send(
              JSON.stringify({
                type: "messages_seen",
                messageIds: response.updatedMessageIds,
                groupId: user.id,
              })
            );
          }
        }
      );
    } else {
      chatApp.currentReceiverId = user.id;
      chatApp.isGroupChat = false;
      chatApp.currentGroupId = null;
      ChatUI.displayCurrentUserInfo(user);
      this.loadUserMessages(user.id, chatApp);
      ChatAPI.markMessagesAsSeen(chatApp.currentUserId, user.id, null).then(
        (response) => {
          if (response.success && response.updatedMessageIds.length > 0) {
            chatApp.socket.send(
              JSON.stringify({
                type: "messages_seen",
                messageIds: response.updatedMessageIds,
                otherUserId: user.id,
              })
            );
          }
        }
      );
    }
  },

  addChatListEventListeners: function (users, chatApp) {
    document.querySelectorAll(".chat-list-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".edit-display-name")) {
          const groupId = item.getAttribute("data-group-id");
          const userId = item.getAttribute("data-user-id");
          if (groupId) {
            ChatUI.displayGroupChatInfo({
              id: parseInt(groupId),
              name: item.querySelector("h3").textContent,
            });
            this.loadGroupMessages(parseInt(groupId), chatApp);
          } else if (userId) {
            const user = users.find((u) => u.id.toString() === userId);
            if (user) {
              ChatUI.displayCurrentUserInfo(user);
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

        ChatUI.showEditDisplayNameModal(chatId, currentName, isGroup, chatApp);
      });
    });
  },

  setupSearchListener: function (users, chatApp) {
    const searchInput = document.querySelector(".search-container input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filteredUsers = users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm) ||
            (user.bio && user.bio.toLowerCase().includes(searchTerm))
        );
        ChatUI.renderChatList(filteredUsers, chatApp);
      });
    }
  },

  loadGroupMessages: function (groupId, chatApp) {
    ChatAPI.fetchGroupMessages(groupId)
      .then((data) => {
        const chatMessages = document.getElementById("chatMessages");
        chatMessages.innerHTML = "";
        ChatUI.resetLastMessageDate(); // Đặt lại lastMessageDate
        data.messages.forEach((message) => {
          ChatUI.addMessage(
            message.content,
            message.sender_id == chatApp.currentUserId,
            message.sender_name,
            message.is_seen,
            new Date(message.timestamp) // Sử dụng timestamp từ database
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
        ChatUI.resetLastMessageDate(); // Đặt lại lastMessageDate
        data.messages.forEach((message) => {
          ChatUI.addMessage(
            message.content,
            message.sender_id == chatApp.currentUserId,
            message.sender_id == chatApp.currentUserId
              ? "Bạn"
              : message.sender_name,
            message.is_seen,
            new Date(message.timestamp) // Sử dụng timestamp từ database
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

  setupMessageSendListener: function (chatApp) {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");

    const sendMessage = () => {
      const content = messageInput.value.trim();
      if (content) {
        if (chatApp.isGroupChat) {
          this.sendGroupMessage(chatApp, content);
        } else {
          this.sendUserMessage(chatApp, content);
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

  sendGroupMessage: function (chatApp, content) {
    if (typeof chatApp.sendGroupMessage === "function") {
      const processedContent = this.processMessageContent(content);
      const currentTime = new Date().toISOString(); // Chuyển đổi thành chuỗi ISO

      ChatUI.addMessage(processedContent, true, "Bạn", false, currentTime);

      chatApp
        .sendGroupMessage(chatApp.currentGroupId, processedContent)
        .then(() => {
          ChatUI.updateLastMessageStatus("Đã gửi");
        })
        .catch((error) => {
          console.error("Lỗi khi gửi tin nhắn nhóm:", error);
          ChatUI.showErrorMessage("Không thể gửi tin nhắn. Vui lòng thử lại.");
        });
    } else {
      console.error("Lỗi: chatApp.sendGroupMessage không phải là một hàm");
    }
  },

  sendUserMessage: function (chatApp, content) {
    if (typeof chatApp.sendMessage === "function") {
      const processedContent = this.processMessageContent(content);
      const currentTime = new Date().toISOString(); // Chuyển đổi thành chuỗi ISO

      ChatUI.addMessage(processedContent, true, "Bạn", false, currentTime);

      chatApp
        .sendMessage(chatApp.currentReceiverId, processedContent)
        .then(() => {
          ChatUI.updateLastMessageStatus("Đã gửi");
        })
        .catch((error) => {
          console.error("Lỗi khi gửi tin nhắn:", error);
          ChatUI.showErrorMessage("Không thể gửi tin nhắn. Vui lòng thử lại.");
        });
    } else {
      console.error("Lỗi: chatApp.sendMessage không phải là một hàm");
    }
  },

  // Thêm hàm mới để xử lý nội dung tin nhắn
  processMessageContent: function (content) {
    // Ở đây bạn có thể thêm logic để xử lý nội dung tin nhắn
    // Ví dụ: chuyển đổi emoji, định dạng văn bản, v.v.
    // Hiện tại, chúng ta chỉ trả về nội dung gốc
    return content;
  },
};

export { ChatEvents };
