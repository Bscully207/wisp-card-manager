import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GetAllTransactionsResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

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

export default router;
