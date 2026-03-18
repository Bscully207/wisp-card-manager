import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Check, CreditCard, ArrowUpCircle, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/use-notifications";

type NotificationType = Notification["type"];

const NOTIF_ICONS: Record<NotificationType, typeof Bell> = {
  topup: ArrowUpCircle,
  freeze: ShieldAlert,
  card: CreditCard,
  info: Info,
};

const NOTIF_COLORS: Record<NotificationType, string> = {
  topup: "text-emerald-500 bg-emerald-500/10",
  freeze: "text-blue-500 bg-blue-500/10",
  card: "text-primary bg-primary/10",
  info: "text-orange-500 bg-orange-500/10",
};

export default function Notifications() {
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  const unread = notifications.filter(n => !n.read);
  const displayed = tab === "unread" ? unread : notifications;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex items-center border-b border-border/50">
        <button
          onClick={() => setTab("unread")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab === "unread"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Unread {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setTab("all")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
      </div>

      <div className="space-y-2">
        {displayed.length > 0 ? (
          displayed.map((notif, i) => {
            const Icon = NOTIF_ICONS[notif.type];
            const colorClass = NOTIF_COLORS[notif.type];
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                  notif.read
                    ? "border-border/30 bg-card/30"
                    : "border-border/50 bg-card/60 cursor-pointer hover:bg-card/80"
                )}
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", !notif.read && "font-semibold")}>{notif.title}</p>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{notif.time}</p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <BellOff className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-medium mb-1">
              {tab === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {tab === "unread" ? "You're all caught up! Switch to 'All' to see past notifications." : "Notifications about your cards and transactions will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
