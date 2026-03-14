import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetAllTransactionsResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.session.userId!));

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
