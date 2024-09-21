const API_BASE_URL = "http://192.168.0.103:3000/api";

const ChatAPI = {
  fetchAllUsers: function (currentUserId) {
    return fetch(`${API_BASE_URL}/chat-users/${currentUserId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          return data.users;
        } else {
          throw new Error(data.message || "Không thể lấy danh sách người dùng");
        }
      });
  },

  sendMessage: function (senderId, receiverId, content) {
    return fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      }),
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorData.message}`
          );
        });
      }
      return response.json();
    });
  },

  updateChatDisplayName: function (userId, chatId, newName, isGroup) {
    return fetch(`${API_BASE_URL}/update-chat-display-name`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        display_name: newName,
        is_group: isGroup,
      }),
    }).then((response) => response.json());
  },

  createOrGetGroupChat: function (creatorId) {
    return fetch(`${API_BASE_URL}/create-or-get-group-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ creator_id: creatorId }),
    }).then((response) => response.json());
  },

  fetchGroupMessages: function (groupId) {
    return fetch(`${API_BASE_URL}/group-messages/${groupId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          return data;
        } else {
          throw new Error(data.message || "Không thể lấy tin nhắn nhóm");
        }
      });
  },

  fetchUserMessages: function (currentUserId, otherUserId) {
    return fetch(`${API_BASE_URL}/messages/${currentUserId}/${otherUserId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          return data;
        } else {
          throw new Error(data.message || "Không thể lấy tin nhắn người dùng");
        }
      });
  },

  updateOnlineStatus: function (userId, onlineStatus) {
    return fetch(`${API_BASE_URL}/update-online-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, online_status: onlineStatus }),
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    });
  },

  getOnlineStatus: function (userId) {
    return fetch(`${API_BASE_URL}/online-status/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          return data.online_status;
        } else {
          throw new Error(
            data.message || "Không thể lấy trạng thái trực tuyến"
          );
        }
      });
  },

  addUserToCommonGroup: function (userId) {
    return fetch(`${API_BASE_URL}/add-user-to-common-group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    }).then((response) => response.json());
  },

  checkNewMessages: function (userId, lastMessageId) {
    return fetch(
      `${API_BASE_URL}/check-new-messages/${userId}/${lastMessageId}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          return data.messages;
        } else {
          throw new Error(data.message || "Không thể kiểm tra tin nhắn mới");
        }
      });
  },

  sendGroupMessage: function (senderId, groupId, content) {
    return fetch(`${API_BASE_URL}/group-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_id: senderId,
        group_id: groupId,
        content,
      }),
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorData.message}`
          );
        });
      }
      return response.json();
    });
  },

  updateLastActivity: function (userId) {
    return fetch(`${API_BASE_URL}/update-last-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    });
  },

  // ... existing methods ...
};
export { ChatAPI };
