import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GetAllTransactionsResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

function csvSafe(value: string): string {
  let escaped = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = "'" + escaped;
  }
  return escaped;
}

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const validTypes = ["topup", "payment", "refund", "fee"];
  const rawType = typeof req.query.type === "string" ? req.query.type : undefined;
  const typeFilter = rawType && validTypes.includes(rawType) ? rawType : undefined;
  if (rawType && !typeFilter) {
    res.status(400).json({ error: "Invalid type filter", message: `type must be one of: ${validTypes.join(", ")}` });
    return;
  }

  const conditions = [eq(transactionsTable.userId, req.session.userId!)];
  if (typeFilter) {
    conditions.push(eq(transactionsTable.type, typeFilter));
  }

  const txs = await db.select().from(transactionsTable).where(and(...conditions));

  res.json(GetAllTransactionsResponse.parse(txs.map(t => ({
    id: t.id,
    cardId: t.cardId,
    userId: t.userId,
    type: t.type as "topup" | "payment" | "refund" | "fee",
    amount: t.amount,
    balanceBefore: t.balanceBefore,
    balanceAfter: t.balanceAfter,
    description: t.description ?? null,
    status: t.status as "pending" | "completed" | "failed",
    createdAt: t.createdAt,
  }))));
});

router.get("/transactions/export", requireAuth, async (req, res): Promise<void> => {
  let txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.session.userId!));

  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
  const cardId = req.query.cardId ? parseInt(req.query.cardId as string, 10) : null;

  if (startDate && isNaN(startDate.getTime())) {
    res.status(400).json({ error: "Invalid startDate" });
    return;
  }
  if (endDate && isNaN(endDate.getTime())) {
    res.status(400).json({ error: "Invalid endDate" });
    return;
  }
  if (startDate && endDate && startDate > endDate) {
    res.status(400).json({ error: "startDate must be before endDate" });
    return;
  }
  if (cardId !== null && isNaN(cardId)) {
    res.status(400).json({ error: "Invalid cardId" });
    return;
  }

  if (cardId) {
    txs = txs.filter(t => t.cardId === cardId);
  }
  if (startDate) {
    txs = txs.filter(t => new Date(t.createdAt) >= startDate);
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    txs = txs.filter(t => new Date(t.createdAt) <= endOfDay);
  }

  const csvHeader = "ID,Card ID,Type,Amount,Balance Before,Balance After,Description,Status,Date\n";
  const csvRows = txs.map(t =>
    [
      t.id,
      t.cardId,
      t.type,
      t.amount,
      t.balanceBefore,
      t.balanceAfter,
      `"${csvSafe(t.description ?? "")}"`,
      t.status,
      new Date(t.createdAt).toISOString(),
    ].join(",")
  ).join("\n");

  const csv = csvHeader + csvRows;
  const filename = `transactions_${new Date().toISOString().split("T")[0]}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;
