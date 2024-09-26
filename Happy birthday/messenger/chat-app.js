import { ChatAPI } from "./chat-api.js";
import { ChatUI } from "./chat-ui.js";
import { ChatEvents } from "./chat-events.js";

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
          // Xử lý kết quả nếu cần
        })
        .catch((error) => {
          console.error("Lỗi khi thêm người dùng vào nhóm chung:", error);
        });

      this.initWebSocket();
      ChatEvents.initUI(this);

      if (window.location.pathname.includes("messenger")) {
        this.loadUserList();
      }

      this.updateOnlineStatus();
      this.startPolling();
    } else {
      console.error("Không tìm thấy thông tin người dùng hiện tại");
      // Xử lý trường hợp không có người dùng đăng nhập
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
        ChatEvents.setupSearchListener(users, this);
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
      console.log("WebSocket connected");
      this.socket.send(
        JSON.stringify({ type: "register", userId: this.currentUserId })
      );
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Thử kết nối lại sau một khoảng thời gian
      setTimeout(() => this.initWebSocket(), 5000);
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        this.handleNewMessage(data.message);
      } else if (data.type === "messages_seen_update") {
        this.updateMessageSeenStatus(
          data.messageIds,
          data.groupId,
          data.otherUserId
        );
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket đã đóng, sẽ thử kết nối lại sau 5 giây");
      this.updateOfflineStatus().then(() => {
        setTimeout(() => this.initWebSocket(), 5000);
      });
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
      if (this.isGroupChat && this.currentGroupId === message.group_id) {
        ChatUI.addMessage(
          message.content,
          message.sender_id === this.currentUserId,
          message.sender_name,
          message.is_seen
        );
        ChatAPI.markMessagesAsSeen(this.currentUserId, null, message.group_id);
      }
      ChatUI.updateChatListWithNewMessage(message, true, this);
    } else {
      if (
        !this.isGroupChat &&
        (this.currentReceiverId === message.sender_id ||
          this.currentReceiverId === message.receiver_id)
      ) {
        ChatUI.addMessage(
          message.content,
          message.sender_id === this.currentUserId,
          message.sender_name,
          message.is_seen
        );
        ChatAPI.markMessagesAsSeen(this.currentUserId, message.sender_id, null);
      }
      ChatUI.updateChatListWithNewMessage(message, false, this);
    }
  },

  sendMessage: function (receiverId, content) {
    return new Promise((resolve, reject) => {
      ChatAPI.sendMessage(this.currentUserId, receiverId, content)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  },

  sendGroupMessage: function (groupId, content) {
    return new Promise((resolve, reject) => {
      ChatAPI.sendGroupMessage(this.currentUserId, groupId, content)
        .then(() => resolve())
        .catch((error) => reject(error));
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
                ChatUI.updateUserOnlineStatus(user.id, false);
              });
          } else {
            ChatUI.updateGroupOnlineStatus(user.id, this.currentUserId);
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
      if (this.isGroupChat && this.currentGroupId) {
        ChatUI.updateGroupOnlineStatus(this.currentGroupId, this.currentUserId);
      }
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
      console.log("WebSocket connected");
      this.socket.send(
        JSON.stringify({ type: "register", userId: this.currentUserId })
      );
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Thử kết nối lại sau một khoảng thời gian
      setTimeout(() => this.initWebSocket(), 5000);
    };

    this.socket.onclose = () => {
      console.log("WebSocket đã đóng, sẽ thử kết nối lại sau 5 giây");
      this.updateOfflineStatus().then(() => {
        setTimeout(() => this.initWebSocket(), 5000);
      });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        this.handleNewMessage(data.message);
      } else if (data.type === "messages_seen_update") {
        this.updateMessageSeenStatus(
          data.messageIds,
          data.groupId,
          data.otherUserId
        );
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

  updateMessageSeenStatus: function (messageIds, groupId, otherUserId) {
    messageIds.forEach((messageId) => {
      ChatUI.updateMessageStatus(messageId, true);
    });
  },

  updateOfflineStatus: function () {
    return ChatAPI.updateOnlineStatus(this.currentUserId, false)
      .then(() => {
        console.log("Đã cập nhật trạng thái offline");
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật trạng thái offline:", error);
        // Thêm xử lý lỗi ở đây, ví dụ:
        // Có thể thử kết nối lại sau một khoảng thời gian
        setTimeout(() => this.updateOfflineStatus(), 5000);
      });
  },
};

export { ChatApp };
