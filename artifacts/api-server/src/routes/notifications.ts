import { Router, type IRouter } from "express";
import { db, notificationsTable, notificationSettingsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  MarkNotificationReadParams,
  UpdateNotificationSettingsBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.session.userId!))
    .orderBy(desc(notificationsTable.createdAt));

  res.json(
    notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }))
  );
});

router.put("/notifications/mark-all-read", requireAuth, async (req, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.session.userId!));

  res.json({ message: "All notifications marked as read" });
});

router.put("/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  const parsed = MarkNotificationReadParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, parsed.data.notificationId),
        eq(notificationsTable.userId, req.session.userId!)
      )
    )
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Not found", message: "Notification not found" });
    return;
  }

  res.json({
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });
});

router.get("/notifications/settings", requireAuth, async (req, res): Promise<void> => {
  const [settings] = await db
    .insert(notificationSettingsTable)
    .values({ userId: req.session.userId! })
    .onConflictDoUpdate({
      target: notificationSettingsTable.userId,
      set: { userId: req.session.userId! },
    })
    .returning();

  res.json({
    id: settings.id,
    userId: settings.userId,
    transactionAlerts: settings.transactionAlerts,
    topupAlerts: settings.topupAlerts,
    securityAlerts: settings.securityAlerts,
    marketingAlerts: settings.marketingAlerts,
  });
});

router.put("/notifications/settings", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateNotificationSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [settings] = await db
    .insert(notificationSettingsTable)
    .values({ userId: req.session.userId!, ...parsed.data })
    .onConflictDoUpdate({
      target: notificationSettingsTable.userId,
      set: parsed.data,
    })
    .returning();

  res.json({
    id: settings.id,
    userId: settings.userId,
    transactionAlerts: settings.transactionAlerts,
    topupAlerts: settings.topupAlerts,
    securityAlerts: settings.securityAlerts,
    marketingAlerts: settings.marketingAlerts,
  });
});

export default router;
