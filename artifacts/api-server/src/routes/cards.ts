import { Router, type IRouter } from "express";
import { db, cardsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetCardsResponse,
  GetCardParams,
  GetCardResponse,
  CreateCardBody,
  DeleteCardParams,
  DeleteCardResponse,
  TopUpCardParams,
  TopUpCardBody,
  TopUpCardResponse,
  FreezeCardParams,
  FreezeCardBody,
  FreezeCardResponse,
  GetCardTransactionsParams,
  GetCardTransactionsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

function generateCardNumber(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(Math.floor(1000 + Math.random() * 9000).toString());
  }
  return segments.join(" ");
}

function generateCvv(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

function toCardResponse(card: typeof cardsTable.$inferSelect) {
  return {
    id: card.id,
    userId: card.userId,
    cardNumber: card.cardNumber,
    cardholderName: card.cardholderName,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    cvv: card.cvv,
    balance: card.balance,
    currency: card.currency,
    status: card.status as "active" | "frozen" | "expired" | "cancelled",
    label: card.label ?? null,
    color: card.color ?? null,
    createdAt: card.createdAt,
  };
}

router.get("/cards", requireAuth, async (req, res): Promise<void> => {
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.session.userId!));
  res.json(GetCardsResponse.parse(cards.map(toCardResponse)));
});

router.post("/cards", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }

  const now = new Date();
  const expiryMonth = now.getMonth() + 1;
  const expiryYear = now.getFullYear() + 4;

  const colors = ["blue", "purple", "green", "orange", "pink", "teal"];
  const defaultColor = colors[Math.floor(Math.random() * colors.length)];

  const [card] = await db.insert(cardsTable).values({
    userId: req.session.userId!,
    cardNumber: generateCardNumber(),
    cardholderName: user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email.split("@")[0].toUpperCase(),
    expiryMonth,
    expiryYear,
    cvv: generateCvv(),
    balance: 0,
    currency: parsed.data.currency || "EUR",
    status: "active",
    label: parsed.data.label ?? null,
    color: parsed.data.color ?? defaultColor,
  }).returning();

  res.status(201).json(GetCardResponse.parse(toCardResponse(card)));
});

router.get("/cards/:cardId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
  const params = GetCardParams.safeParse({ cardId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, req.session.userId!))
  );

  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(GetCardResponse.parse(toCardResponse(card)));
});

router.delete("/cards/:cardId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
  const params = DeleteCardParams.safeParse({ cardId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const [card] = await db.delete(cardsTable).where(
    and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, req.session.userId!))
  ).returning();

  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(DeleteCardResponse.parse({ message: "Card deleted successfully" }));
});

router.post("/cards/:cardId/topup", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
  const params = TopUpCardParams.safeParse({ cardId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = TopUpCardBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, req.session.userId!))
  );

  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  if (card.status === "frozen") {
    res.status(400).json({ error: "Bad request", message: "Cannot top up a frozen card" });
    return;
  }

  const balanceBefore = card.balance;
  const balanceAfter = balanceBefore + body.data.amount;

  const [updatedCard] = await db.update(cardsTable).set({ balance: balanceAfter }).where(eq(cardsTable.id, card.id)).returning();

  await db.insert(transactionsTable).values({
    cardId: card.id,
    userId: req.session.userId!,
    type: "topup",
    amount: body.data.amount,
    balanceBefore,
    balanceAfter,
    description: body.data.description ?? `Top up of ${body.data.amount} ${card.currency}`,
    status: "completed",
  });

  res.json(TopUpCardResponse.parse(toCardResponse(updatedCard)));
});

router.post("/cards/:cardId/freeze", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
  const params = FreezeCardParams.safeParse({ cardId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = FreezeCardBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, req.session.userId!))
  );

  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  const newStatus = body.data.frozen ? "frozen" : "active";
  const [updatedCard] = await db.update(cardsTable).set({ status: newStatus }).where(eq(cardsTable.id, card.id)).returning();

  res.json(FreezeCardResponse.parse(toCardResponse(updatedCard)));
});

router.get("/cards/:cardId/transactions", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cardId) ? req.params.cardId[0] : req.params.cardId;
  const params = GetCardTransactionsParams.safeParse({ cardId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.userId, req.session.userId!))
  );

  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.cardId, card.id));

  res.json(GetCardTransactionsResponse.parse(txs.map(t => ({
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
