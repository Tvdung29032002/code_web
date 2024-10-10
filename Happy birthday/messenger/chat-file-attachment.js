import { ChatAPI } from "./chat-api.js";
import { ChatUI } from "./chat-ui-utils.js";

const FileAttachment = {
  init: function (chatApp) {
    const fileInput = document.getElementById("fileInput");
    const attachButton = document.getElementById("attachButton");

    attachButton.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        this.handleFileAttachment(file, chatApp);
      }
    });
  },

  handleFileAttachment: function (file, chatApp) {
    // Kiểm tra kích thước file (giới hạn 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ChatUI.showErrorMessage(
        "Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Tạo ID tạm thời cho tin nhắn
    const tempId = "temp_" + Date.now();
    const currentTime = new Date();

    // Hiển thị tin nhắn tạm thời với icon "đang tải"
    ChatUI.addMessage(
      `<div class="file-uploading">Đang tải lên ${file.name}...</div>`,
      true,
      "Bạn",
      false,
      currentTime,
      tempId
    );

    // Gửi file lên server
    ChatAPI.uploadFile(formData)
      .then((response) => {
        if (response.success) {
          const fileUrl = response.fileUrl;
          const messageContent = this.createFileMessageContent(file, fileUrl);

          // Cập nhật nội dung tin nhắn với thông tin file đã tải lên
          ChatUI.updateMessage(tempId, messageContent);

          // Gửi tin nhắn chứa thông tin file
          if (chatApp.isGroupChat) {
            chatApp
              .sendGroupMessage(chatApp.currentGroupId, messageContent)
              .then((sendResponse) => {
                if (sendResponse.success) {
                  ChatUI.updateMessageId(tempId, sendResponse.message_id);
                  ChatUI.updateLastMessage(
                    chatApp,
                    chatApp.currentGroupId,
                    "Đã gửi một tệp đính kèm",
                    true
                  );
                } else {
                  throw new Error("Không thể gửi tin nhắn file trong nhóm");
                }
              })
              .catch((error) => {
                console.error("Lỗi khi gửi tin nhắn file trong nhóm:", error);
                ChatUI.showErrorMessage(
                  "Không thể gửi file. Vui lòng thử lại."
                );
                ChatUI.removeMessage(tempId);
              });
          } else {
            chatApp
              .sendMessage(chatApp.currentReceiverId, messageContent)
              .then((sendResponse) => {
                if (sendResponse.success) {
                  ChatUI.updateMessageId(tempId, sendResponse.message_id);
                  ChatUI.updateLastMessage(
                    chatApp,
                    chatApp.currentReceiverId,
                    "Đã gửi một tệp đính kèm",
                    false
                  );
                } else {
                  throw new Error("Không thể gửi tin nhắn file");
                }
              })
              .catch((error) => {
                console.error("Lỗi khi gửi tin nhắn file:", error);
                ChatUI.showErrorMessage(
                  "Không thể gửi file. Vui lòng thử lại."
                );
                ChatUI.removeMessage(tempId);
              });
          }
        } else {
          throw new Error(response.message || "Lỗi khi tải file lên");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải file lên:", error);
        ChatUI.showErrorMessage("Không thể tải file lên. Vui lòng thử lại.");
        ChatUI.removeMessage(tempId);
      });
  },

  createFileMessageContent: function (file, fileUrl) {
    const fileType = this.getFileType(file);
    const fileName = file.name;
    const fileSize = this.formatFileSize(file.size);

    let fileIcon;
    switch (fileType) {
      case "image":
        return `<img src="${fileUrl}" alt="${fileName}" style="max-width: 200px; max-height: 200px;">`;
      case "pdf":
        fileIcon = "📄";
        break;
      case "excel":
        fileIcon = "📊";
        break;
      case "word":
        fileIcon = "📝";
        break;
      default:
        fileIcon = "📎";
    }

    return `
      <div class="file-attachment">
        <span class="file-icon">${fileIcon}</span>
        <a href="${fileUrl}" target="_blank" download="${fileName}">
          <span class="file-name">${fileName}</span>
        </a>
        <span class="file-size">(${fileSize})</span>
      </div>
    `;
  },

  getFileType: function (file) {
    const extension = file.name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["xls", "xlsx"].includes(extension)) {
      return "excel";
    } else if (["doc", "docx"].includes(extension)) {
      return "word";
    } else {
      return "other";
    }
  },

  formatFileSize: function (bytes) {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  },
};

export { FileAttachment };
