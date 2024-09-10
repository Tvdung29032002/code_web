import React from "react";

interface NotificationProps {
  title: string;
  message: string;
  date: string;
  type: "task" | "system" | "warning";
}

const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  date,
  type,
}) => {
  const getIcon = () => {
    switch (type) {
      case "task":
        return "📅";
      case "system":
        return "🔔";
      case "warning":
        return "⚠️";
      default:
        return "📌";
    }
  };

  return (
    <div className={`notification-item notification-${type}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        <div className="notification-message">{message}</div>
        <div className="notification-date">{date}</div>
      </div>
    </div>
  );
};

export default Notification;
