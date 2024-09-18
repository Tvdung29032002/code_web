let activeChats = [];

export function initChatPopup() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="chat-popups-container" style="position: fixed; bottom: 0; right: 0; display: flex; flex-direction: row-reverse;"></div>`
  );
}

export function openChatPopup(user) {
  if (activeChats.find((chat) => chat.id === user.id)) {
    return; // Nếu chat đã mở, không làm gì cả
  }

  const popupId = `chat-popup-${user.id}`;
  const popupHtml = `
    <div id="${popupId}" class="chat-popup" style="width: 300px; height: 400px; border: 1px solid #ccc; margin-right: 10px; background: white; display: flex; flex-direction: column;">
      <div class="chat-header" style="padding: 10px; background: #f1f1f1; cursor: pointer; display: flex; justify-content: space-between;">
        <span>${user.name}</span>
        <span class="close-chat">&times;</span>
      </div>
      <div class="chat-messages" style="flex-grow: 1; overflow-y: auto; padding: 10px;"></div>
      <div class="chat-input" style="padding: 10px;">
        <input type="text" placeholder="Nhập tin nhắn..." style="width: 100%;">
      </div>
    </div>
  `;

  document
    .getElementById("chat-popups-container")
    .insertAdjacentHTML("afterbegin", popupHtml);

  const popup = document.getElementById(popupId);
  const closeBtn = popup.querySelector(".close-chat");
  const input = popup.querySelector("input");
  const messagesContainer = popup.querySelector(".chat-messages");

  closeBtn.addEventListener("click", () => {
    popup.remove();
    activeChats = activeChats.filter((chat) => chat.id !== user.id);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      const message = input.value.trim();
      messagesContainer.insertAdjacentHTML(
        "beforeend",
        `<div style="text-align: right;">${message}</div>`
      );
      input.value = "";
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Gửi tin nhắn đến server (cần thêm logic này sau)
      sendMessage(user.id, message);
    }
  });

  activeChats.push(user);

  // Tải tin nhắn cũ (cần thêm logic này sau)
  loadMessages(user.id);
}

function sendMessage(receiverId, content) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  fetch("http://192.168.0.103:3000/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: content,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.success) {
        console.error("Lỗi khi gửi tin nhắn:", data.message);
      }
    })
    .catch((error) => {
      console.error("Lỗi khi gửi tin nhắn:", error);
    });
}

function loadMessages(userId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  fetch(`http://192.168.0.103:3000/api/messages/${currentUser.id}/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const messagesContainer = document.querySelector(
          `#chat-popup-${userId} .chat-messages`
        );
        messagesContainer.innerHTML = "";
        data.messages.forEach((message) => {
          const isCurrentUser = message.sender_id == currentUser.id;
          messagesContainer.insertAdjacentHTML(
            "beforeend",
            `
            <div style="text-align: ${isCurrentUser ? "right" : "left"};">${
              message.content
            }</div>
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
