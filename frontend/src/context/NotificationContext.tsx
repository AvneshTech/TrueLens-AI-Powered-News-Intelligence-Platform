import { createContext, useContext, useState } from "react";

type Notification = {
  id: number;
  message: string;
  time: string;
  read: boolean;
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (msg: string) => void;
  markAsRead: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (msg: string) => {
    const newNotification = {
      id: Date.now(),
      message: msg,
      time: "just now",
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used inside Provider");
  return context;
};