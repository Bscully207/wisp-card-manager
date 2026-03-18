import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Notification {
  id: number;
  type: "topup" | "freeze" | "card" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "topup", title: "Top-up successful", message: "Your Everyday Card was topped up with $50.00", time: "2 hours ago", read: false },
  { id: 2, type: "card", title: "New card created", message: "Your virtual card 'Travel Card' is ready to use", time: "1 day ago", read: false },
  { id: 3, type: "freeze", title: "Card frozen", message: "Savings Reserve card has been temporarily frozen", time: "3 days ago", read: true },
  { id: 4, type: "info", title: "Welcome to Wisp", message: "Start by creating your first virtual debit card", time: "1 week ago", read: true },
];

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
