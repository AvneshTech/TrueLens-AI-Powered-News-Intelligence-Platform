import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useAuth } from "./AuthContext";
import { apiService, NotificationItem } from "../services/apiService";
import { getWebSocketUrl } from "../utils/websocket";

type NotificationContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  /** @deprecated kept for backward compatibility — notifications are created server-side now. */
  addNotification: (msg: string) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

const WS_URL = getWebSocketUrl();

export const NotificationProvider = ({ children }: any) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const stompRef = useRef<any>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refresh = async () => {
    try {
      const res = await apiService.getNotifications();
      if (res?.success) setNotifications(res.data || []);
    } catch {
      // not logged in / network — ignore
    }
  };

  // Load + subscribe whenever the authenticated user changes.
  useEffect(() => {
    if (!user?.email) {
      setNotifications([]);
      if (stompRef.current) {
        stompRef.current.deactivate();
        stompRef.current = null;
      }
      return;
    }

    refresh();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/topic/notifications/${user.email}`,
          (frame) => {
            try {
              const incoming: NotificationItem = JSON.parse(frame.body);
              setNotifications((prev) => {
                if (prev.some((n) => n.id === incoming.id)) return prev;
                return [incoming, ...prev];
              });
            } catch {
              // ignore malformed frames
            }
          },
        );
      },
    });

    stompRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    apiService.markNotificationRead(id).catch(() => refresh());
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    apiService.markAllNotificationsRead().catch(() => refresh());
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    apiService.deleteNotification(id).catch(() => refresh());
  };

  // Backward-compat: pages still call addNotification(msg) after actions that now
  // generate a real server-side notification (delivered over WebSocket), so this is a no-op.
  const addNotification = (_msg: string) => {};

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refresh,
        markAsRead,
        markAllRead,
        deleteNotification,
        addNotification,
      }}
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
