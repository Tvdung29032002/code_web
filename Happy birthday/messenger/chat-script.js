// Tạo một đối tượng toàn cục để lưu trữ các hàm và biến
const ChatApp = {
  currentReceiverId: null,
  currentUserId: null,
  isGroupChat: false,
  currentGroupId: null,

  fetchAllUsers: function () {
    return fetch(
      `http://192.168.0.103:3000/api/chat-users/${this.currentUserId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          return data.users;
        } else {
          throw new Error(data.message || "Không thể lấy danh sách người dùng");
        }
      });
  },

  renderChatList: function (users) {
    const chatList = document.getElementById("chat-list");
    let chatListHTML = "";

    users.forEach((user) => {
      const isGroup = user.is_group === 1;
      chatListHTML += `
        <li class="chat-list-item" data-${isGroup ? "group" : "user"}-id="${
        user.id
      }">
          <img src="${user.photo_url || "/uploads/default.jpg"}" alt="${
        user.name
      }" class="chat-avatar">
          <div>
            <h3>${user.display_name || user.name}</h3>
            <p>${
              user.bio ? user.bio.substring(0, 30) + "..." : "Chưa có tiểu sử"
            }</p>
          </div>
          <button class="edit-display-name" data-chat-id="${
            user.id
          }" data-is-group="${isGroup}">
            <i class="fas fa-edit"></i>
          </button>
        </li>
      `;
    });

    chatList.innerHTML = chatListHTML;

    this.addChatListEventListeners(users);
  },

  addChatListEventListeners: function (users) {
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
            this.loadGroupMessages(parseInt(groupId));
          } else if (userId) {
            const user = users.find((u) => u.id.toString() === userId);
            if (user) {
              this.displayCurrentUserInfo(user);
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
        const newName = prompt("Nhập tên hiển thị mới:", currentName);
        if (newName && newName !== currentName) {
          this.updateChatDisplayName(chatId, newName, isGroup);
        }
      });
    });
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
    this.isGroupChat = true;
    this.currentGroupId = groupChat.id;
    this.currentReceiverId = null;
  },

  loadGroupMessages: function (groupId) {
    fetch(`http://192.168.0.103:3000/api/group-messages/${groupId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const chatMessages = document.getElementById("chatMessages");
          chatMessages.innerHTML = "";
          data.messages.forEach((message) => {
            this.addMessage(
              message.content,
              message.sender_id == this.currentUserId,
              message.sender_name
            );
          });
        } else {
          console.error("Lỗi khi tải tin nhắn nhóm:", data.message);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải tin nhắn nhóm:", error);
      });
  },

  displayCurrentUserInfo: function (user) {
    // Implement this function
    console.log("Displaying current user info:", user);
  },

  updateChatDisplayName: function (chatId, newName, isGroup) {
    fetch("http://192.168.0.103:3000/api/update-chat-display-name", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: this.currentUserId,
        chat_id: chatId,
        display_name: newName,
        is_group: isGroup,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("Tên hiển thị đã được cập nhật");
          const chatItem = document.querySelector(
            `[data-${isGroup ? "group" : "user"}-id="${chatId}"]`
          );
          if (chatItem) {
            chatItem.querySelector("h3").textContent = newName;
          }
          if (isGroup && this.currentGroupId === parseInt(chatId)) {
            this.displayGroupChatInfo({ id: chatId, name: newName });
          }
        } else {
          console.error("Lỗi khi cập nhật tên hiển thị:", data.message);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi gửi yêu cầu cập nhật tên hiển thị:", error);
      });
  },

  sendMessage: function () {
    const messageInput = document.getElementById("messageInput");
    const content = messageInput.value.trim();
    if (content) {
      const url = this.isGroupChat
        ? "http://192.168.0.103:3000/api/group-messages"
        : "http://192.168.0.103:3000/api/messages";
      const body = this.isGroupChat
        ? {
            sender_id: this.currentUserId,
            group_id: this.currentGroupId,
            content: content,
          }
        : {
            sender_id: this.currentUserId,
            receiver_id: this.currentReceiverId,
            content: content,
          };

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            this.addMessage(content, true);
            messageInput.value = "";
          } else {
            console.error("Lỗi khi gửi tin nhắn:", data.message);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi gửi tin nhắn:", error);
        });
    }
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

  init: function () {
    document.addEventListener("DOMContentLoaded", () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (currentUser && currentUser.id) {
        this.currentUserId = currentUser.id;
      } else {
        console.error("Không tìm thấy thông tin người dùng hiện tại");
        window.location.href = "/login.html";
        return;
      }

      const sendButton = document.getElementById("sendButton");
      const messageInput = document.getElementById("messageInput");
      const searchInput = document.querySelector(".search-container input");
      const newChatBtn = document.querySelector(".new-chat-btn");
      const groupChatButton = document.getElementById("groupChatButton");

      this.fetchAllUsers()
        .then((users) => {
          this.renderChatList(users);

          searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.trim();
            const filteredUsers = this.searchUsers(users, searchTerm);
            this.renderChatList(filteredUsers);
          });
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
          document.getElementById("chat-list").innerHTML =
            "<li>Không thể tải danh sách người dùng.</li>";
        });

      sendButton.addEventListener("click", () => this.sendMessage());
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage();
        }
      });

      newChatBtn.addEventListener("click", () => {
        alert("Tính năng tạo chat mới sẽ được thêm vào sau!");
      });

      groupChatButton.addEventListener("click", () => {
        fetch("http://192.168.0.103:3000/api/create-or-get-group-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ creator_id: this.currentUserId }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              this.displayGroupChatInfo(data.groupChat);
              this.loadGroupMessages(data.groupChat.id);
            } else {
              console.error("Lỗi khi tạo hoặc lấy nhóm chat:", data.message);
            }
          })
          .catch((error) => {
            console.error("Lỗi khi tạo hoặc lấy nhóm chat:", error);
          });
      });
    });
  },

  searchUsers: function (users, searchTerm) {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },
};

// Khởi tạo ứng dụng
ChatApp.init();
