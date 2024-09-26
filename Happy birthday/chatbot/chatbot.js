let chatbotMessages;
let chatbotInitialized = false;

function addMessage(message, sender) {
  if (chatbotMessages) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${sender}-message`;
    messageElement.textContent = message;
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
}

async function processMessage(message) {
  try {
    const response = await fetch(
      "http://192.168.0.103:3000/api/chatbot-responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      throw new Error("Lỗi khi gửi yêu cầu đến server");
    }

    const data = await response.json();
    addMessage(data.response, "bot");

    if (data.actions && data.actions.length > 0) {
      data.actions.forEach((action) => {
        if (action.type === "suggestQuestions") {
          addSuggestedQuestions(action.data);
        }
      });
    }
  } catch (error) {
    // Xóa console.error ở đây
    addMessage("Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn.", "bot");
  }
}

function addSuggestedQuestions(questions) {
  if (chatbotMessages) {
    const suggestedQuestionsContainer = document.createElement("div");
    suggestedQuestionsContainer.className = "suggested-questions";

    questions.forEach((question) => {
      const questionButton = document.createElement("button");
      questionButton.className = "suggested-question-button";
      questionButton.textContent = question;
      questionButton.addEventListener("click", () => {
        addMessage(question, "user");
        processMessage(question);
      });
      suggestedQuestionsContainer.appendChild(questionButton);
    });

    chatbotMessages.appendChild(suggestedQuestionsContainer);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
}

// Thêm hàm để hiển thị câu chào và câu hỏi gợi ý ban đầu
function initializeChatbot() {
  if (chatbotMessages && !chatbotInitialized) {
    addMessage("Xin chào! Tôi có thể giúp gì cho bạn?", "bot");
    const initialQuestions = [
      "Bạn có thể giúp gì cho tôi?",
      "Làm thế nào để đặt câu hỏi?",
      "Thông tin liên hệ",
    ];
    addSuggestedQuestions(initialQuestions);
    chatbotInitialized = true;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const minimizeChatbotButton = document.getElementById("minimize-chatbot");
  chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotForm = document.getElementById("chatbot-form");
  const chatbotInput = document.getElementById("chatbot-input");

  if (minimizeChatbotButton) {
    minimizeChatbotButton.addEventListener("click", function () {
      window.parent.postMessage("minimizeChatBot", "*");
    });
  }

  if (chatbotForm) {
    chatbotForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const message = chatbotInput.value.trim();
      if (message) {
        addMessage(message, "user");
        chatbotInput.value = "";
        processMessage(message);
      }
    });
  }

  // Gọi hàm khởi tạo khi trang được tải
  initializeChatbot();

  // Thông báo cho parent window rằng chatbot đã được tải
  window.parent.postMessage("chatbotLoaded", "*");
});

// Thêm đoạn mã này để xử lý trường hợp chatbot được nhúng vào trang chính
if (window.parent !== window) {
  window.parent.postMessage("chatbotLoaded", "*");
}

window.addEventListener("message", function (event) {
  if (event.data === "initializeChatbot") {
    // Xóa console.log ở đây
    initializeChatbot();
  }
});

// Thông báo cho parent window rằng chatbot đã được tải
window.parent.postMessage("chatbotLoaded", "*");

// Lắng nghe tin nhắn từ parent window
window.addEventListener("message", function (event) {
  if (event.data === "initializeChatbot") {
    // Xóa console.log ở đây
    initializeChatbot();
  }
});
