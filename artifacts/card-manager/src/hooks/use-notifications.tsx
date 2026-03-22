import { createContext, useContext, useCallback, type ReactNode } from "react";
import {
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getGetNotificationsQueryKey,
  type Notification as ApiNotification,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: number;
  type: "topup" | "freeze" | "card" | "info" | "security";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function mapNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    type: n.type as Notification["type"],
    title: n.title,
    message: n.message,
    time: formatTimeAgo(n.createdAt),
    read: n.isRead,
  };
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllRead: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: rawNotifications, isLoading } = useGetNotifications();

  const notifications = (rawNotifications || []).map(mapNotification);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markOneMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  const markAllMutation = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  const markAsRead = useCallback(
    (id: number) => {
      markOneMutation.mutate({ notificationId: id });
    },
    [markOneMutation]
  );

  const markAllRead = useCallback(() => {
    markAllMutation.mutate();
  }, [markAllMutation]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
