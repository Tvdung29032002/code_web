import { ChatAPI } from "./chat-api.js";
import { ChatUI } from "./chat-ui.js";

const ChatApp = {
  currentReceiverId: null,
  currentUserId: null,
  isGroupChat: false,
  currentGroupId: null,
  socket: null,
  lastMessageId: 0,
  pollingInterval: null,

  init: function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;

      ChatAPI.addUserToCommonGroup(this.currentUserId)
        .then((data) => {
          // Xóa console.log và console.error
        })
        .catch((error) => {
          // Xóa console.error
        });

      this.initWebSocket();
      ChatUI.initUI(this);

      if (window.location.pathname.includes("messenger")) {
        this.loadUserList();
      }

      this.updateOnlineStatus();
      this.startPolling();
    }
  },
  initForHomepage: function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.id) {
      this.currentUserId = currentUser.id;
      this.updateOnlineStatus();
      this.startPolling();
    }
  },

  loadUserList: function () {
    ChatAPI.fetchAllUsers(this.currentUserId)
      .then((users) => {
        ChatUI.renderChatList(users, this);
        ChatUI.setupSearchListener(users, this);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        const chatList = document.getElementById("chat-list");
        if (chatList) {
          chatList.innerHTML = "<li>Không thể tải danh sách người dùng.</li>";
        }
      });
  },

  initWebSocket: function () {
    this.socket = new WebSocket("ws://192.168.0.103:3000");

    this.socket.onopen = () => {
      this.socket.send(
        JSON.stringify({ type: "register", userId: this.currentUserId })
      );
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        this.handleNewMessage(data.message);
      }
    };

    this.socket.onerror = (error) => {
      // Xóa console.error
    };

    this.socket.onclose = (event) => {
      // Xóa console.log
    };

    window.addEventListener("beforeunload", () => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            type: "offline",
            userId: this.currentUserId,
          })
        );
      }
    });
  },

  handleNewMessage: function (message) {
    if (message.group_id) {
      // Tin nhắn nhóm
      if (this.isGroupChat && this.currentGroupId === message.group_id) {
        ChatUI.addMessage(
          message.content,
          message.sender_id === this.currentUserId,
          message.sender_name
        );
      }
      ChatUI.updateChatListWithNewMessage(message, true, this);
    } else {
      // Tin nhắn cá nhân
      if (
        !this.isGroupChat &&
        (this.currentReceiverId === message.sender_id ||
          this.currentReceiverId === message.receiver_id)
      ) {
        ChatUI.addMessage(
          message.content,
          message.sender_id === this.currentUserId,
          message.sender_name
        );
      }
      ChatUI.updateChatListWithNewMessage(message, false, this);
    }
  },

  sendMessage: function (receiverId, content) {
    this.updateLastActivity(); // Cập nhật last_activity khi gửi tin nhắn
    return new Promise((resolve, reject) => {
      if (this.checkAndReconnectWebSocket()) {
        const message = {
          type: "chat",
          sender_id: this.currentUserId,
          receiver_id: receiverId,
          content: content,
        };
        this.socket.send(JSON.stringify(message));

        // Gọi API để lưu tin nhắn
        ChatAPI.sendMessage(this.currentUserId, receiverId, content)
          .then(() => resolve())
          .catch((error) => reject(error));
      } else {
        console.log("WebSocket không sẵn sàng, đang gửi tin nhắn qua API HTTP");
        // Gửi tin nhắn qua API HTTP
        ChatAPI.sendMessage(this.currentUserId, receiverId, content)
          .then(() => resolve())
          .catch((error) => reject(error));
      }
    });
  },

  sendGroupMessage: function (groupId, content) {
    if (content === undefined) {
      console.error("Nội dung tin nhắn không được định nghĩa");
      return;
    }

    content = content.trim();
    if (!content) {
      console.error("Nội dung tin nhắn trống");
      return;
    }

    ChatAPI.sendGroupMessage(this.currentUserId, groupId, content)
      .then((data) => {
        if (data.success) {
          ChatUI.addMessage(content, true);
          // Gửi tin nhắn qua WebSocket nếu cần
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(
              JSON.stringify({
                type: "new_group_message",
                message: {
                  sender_id: this.currentUserId,
                  group_id: groupId,
                  content: content,
                },
              })
            );
          }
        } else {
          console.error("Lỗi khi gửi tin nhắn nhóm:", data.message);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi gửi tin nhắn nhóm:", error);
      });
  },

  updateChatDisplayName: function (chatId, newName, isGroup) {
    ChatAPI.updateChatDisplayName(this.currentUserId, chatId, newName, isGroup)
      .then((data) => {
        if (data.success) {
          console.log("Tên hiển thị đã được cập nhật");
          ChatUI.updateChatListItem(chatId, newName, isGroup);
          if (isGroup && this.currentGroupId === parseInt(chatId)) {
            ChatUI.displayGroupChatInfo({ id: chatId, name: newName });
          }
        } else {
          console.error("Lỗi khi cập nhật tên hiển thị:", data.message);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi gửi yêu cầu cập nhật tên hiển thị:", error);
      });
  },

  updateUserOnlineStatus: function (userId, onlineStatus) {
    ChatUI.updateUserOnlineStatus(userId, onlineStatus);
  },

  updateAllUsersOnlineStatus: function () {
    ChatAPI.fetchAllUsers(this.currentUserId)
      .then((users) => {
        users.forEach((user) => {
          if (!user.is_group) {
            ChatAPI.getOnlineStatus(user.id)
              .then((onlineStatus) => {
                ChatUI.updateUserOnlineStatus(user.id, onlineStatus);
              })
              .catch((error) => {
                console.error(
                  `Lỗi khi cập nhật trạng thái của user ${user.id}:`,
                  error.message
                );
                // Có thể thêm xử lý lỗi khác ở đây, ví dụ: hiển thị trạng thái là "Không xác định"
                ChatUI.updateUserOnlineStatus(user.id, null);
              });
          }
        });
      })
      .catch((error) => {
        console.error(
          "Lỗi khi cập nhật trạng thái trực tuyến của người dùng:",
          error.message
        );
      });
  },

  startPolling: function () {
    this.pollingInterval = setInterval(() => {
      this.checkForNewMessages();
      this.updateAllUsersOnlineStatus();
    }, 5000); // Kiểm tra mỗi 5 giây
  },

  checkForNewMessages: function () {
    this.updateLastActivity(); // Cập nhật last_activity khi kiểm tra tin nhắn mới
    ChatAPI.checkNewMessages(this.currentUserId, this.lastMessageId)
      .then((newMessages) => {
        newMessages.forEach((message) => {
          this.handleNewMessage(message);
          if (message.id > this.lastMessageId) {
            this.lastMessageId = message.id;
          }
        });
      })
      .catch((error) => {
        console.error("Lỗi khi kiểm tra tin nhắn mới:", error);
      });
  },

  updateLastActivity: function () {
    ChatAPI.updateLastActivity(this.currentUserId)
      .then(() => {})
      .catch((error) => {
        console.error("Lỗi khi cập nhật last_activity:", error);
      });
  },

  updateOnlineStatus: function () {
    ChatAPI.updateOnlineStatus(this.currentUserId, true)
      .then((response) => {
        if (response && response.success) {
          console.log("Đã cập nhật trạng thái trực tuyến");
        } else {
          console.warn("Cập nhật trạng thái trực tuyến không thành công");
        }
      })
      .catch((error) =>
        console.error("Lỗi khi cập nhật trạng thái trực tuyến:", error)
      );
  },

  checkAndReconnectWebSocket() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket không sẵn sàng, đang thử kết nối lại...");
      this.initWebSocket();
      return false;
    }
    return true;
  },

  initWebSocket() {
    this.socket = new WebSocket("ws://192.168.0.103:3000");

    this.socket.onopen = () => {
      this.socket.send(
        JSON.stringify({ type: "register", userId: this.currentUserId })
      );
    };

    this.socket.onclose = () => {
      console.log("WebSocket đã đóng, sẽ thử kết nối lại sau 5 giây");
      setTimeout(() => this.initWebSocket(), 5000);
    };

    this.socket.onerror = (error) => {
      console.error("Lỗi WebSocket:", error);
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        this.handleNewMessage(data.message);
      }
    };

    window.addEventListener("beforeunload", () => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            type: "offline",
            userId: this.currentUserId,
          })
        );
      }
    });
  },

  updateOfflineStatus: function () {
    return ChatAPI.updateOnlineStatus(this.currentUserId, false)
      .then(() => {
        // Xóa console.log
      })
      .catch((error) => {
        // Xóa console.error
      });
  },
};

export { ChatApp };
