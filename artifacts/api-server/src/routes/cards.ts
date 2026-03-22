import { Router, type IRouter } from "express";
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
  UpdateCardPinParams,
  UpdateCardPinBody,
  UpdateCardPinResponse,
  GetCardTransactionsParams,
  GetCardTransactionsResponse,
  GetCardDetailsWithTransactionsParams,
  GetCardDetailsWithTransactionsResponse,
  CreateCardAccessUrlParams,
  CreateCardAccessUrlResponse,
  GetCardBalanceHistoryParams,
  GetCardBalanceHistoryResponse,
  UpdateCardContactsParams,
  UpdateCardContactsBody,
  UpdateCardContactsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  getUserCards,
  getCardByIdForUser,
  createCard,
  topUpCard,
  freezeCard,
  updateCardPin,
  deleteCard,
  getCardTransactions,
  getCardBalanceHistory,
  updateCardContacts,
  toCardResponse,
} from "../services/card.service.js";

const router: IRouter = Router();

function parseCardId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

router.get("/cards", requireAuth, async (req, res): Promise<void> => {
  const cards = await getUserCards(req.session.userId!);
  res.json(GetCardsResponse.parse(cards.map(toCardResponse)));
});

router.post("/cards", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const card = await createCard({
    userId: req.session.userId!,
    currency: parsed.data.currency || "EUR",
    label: parsed.data.label,
    color: parsed.data.color,
  });

  if (!card) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }

  res.status(201).json(GetCardResponse.parse(toCardResponse(card)));
});

router.get("/cards/:cardId", requireAuth, async (req, res): Promise<void> => {
  const params = GetCardParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const card = await getCardByIdForUser(params.data.cardId, req.session.userId!);
  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(GetCardResponse.parse(toCardResponse(card)));
});

router.delete("/cards/:cardId", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCardParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const card = await deleteCard(params.data.cardId, req.session.userId!);
  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(DeleteCardResponse.parse({ message: "Card deleted successfully" }));
});

router.post("/cards/:cardId/topup", requireAuth, async (req, res): Promise<void> => {
  const params = TopUpCardParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = TopUpCardBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const result = await topUpCard(
    params.data.cardId,
    req.session.userId!,
    body.data.amount,
    body.data.description
  );

  if ("error" in result) {
    if (result.error === "not_found") {
      res.status(404).json({ error: "Not found", message: "Card not found" });
    } else {
      res.status(400).json({ error: "Bad request", message: "Cannot top up a frozen card" });
    }
    return;
  }

  res.json(TopUpCardResponse.parse(toCardResponse(result.card)));
});

router.put("/cards/:cardId/pin", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCardPinParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = UpdateCardPinBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const result = await updateCardPin(params.data.cardId, req.session.userId!, body.data.pin);
  if (!result) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(UpdateCardPinResponse.parse({ message: "PIN updated successfully" }));
});

router.post("/cards/:cardId/freeze", requireAuth, async (req, res): Promise<void> => {
  const params = FreezeCardParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = FreezeCardBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const updatedCard = await freezeCard(params.data.cardId, req.session.userId!, body.data.frozen);
  if (!updatedCard) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(FreezeCardResponse.parse(toCardResponse(updatedCard)));
});

router.get("/cards/:cardId/details-with-transactions", requireAuth, async (req, res): Promise<void> => {
  const params = GetCardDetailsWithTransactionsParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const card = await getCardByIdForUser(params.data.cardId, req.session.userId!);
  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  const txs = await getCardTransactions(params.data.cardId, req.session.userId!);

  const transactions = (txs ?? []).map(t => ({
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
  }));

  res.json(GetCardDetailsWithTransactionsResponse.parse({
    card: toCardResponse(card),
    transactions,
  }));
});

router.get("/cards/:cardId/transactions", requireAuth, async (req, res): Promise<void> => {
  const params = GetCardTransactionsParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const validTypes = ["topup", "payment", "refund", "fee"];
  const rawType = typeof req.query.type === "string" ? req.query.type : undefined;
  const typeFilter = rawType && validTypes.includes(rawType) ? rawType : undefined;
  if (rawType && !typeFilter) {
    res.status(400).json({ error: "Invalid type filter", message: `type must be one of: ${validTypes.join(", ")}` });
    return;
  }
  const txs = await getCardTransactions(params.data.cardId, req.session.userId!, typeFilter);
  if (!txs) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

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

router.get("/cards/:cardId/balance-history/export", requireAuth, async (req, res): Promise<void> => {
  const cardId = parseCardId(req.params.cardId);
  if (isNaN(cardId)) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const card = await getCardByIdForUser(cardId, req.session.userId!);
  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  const balanceHistoryTypes = ["topup", "fee", "refund"];
  const txs = await getCardTransactions(cardId, req.session.userId!);
  const rows = (txs ?? [])
    .filter(t => balanceHistoryTypes.includes(t.type))
    .map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      description: t.description ?? "",
      status: t.status,
      createdAt: t.createdAt,
    }));

  function sanitizeCsvCell(value: string): string {
    let sanitized = value.replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(sanitized)) {
      sanitized = "'" + sanitized;
    }
    sanitized = sanitized.replace(/[\r\n]+/g, " ");
    return `"${sanitized}"`;
  }

  const csvHeader = "ID,Type,Amount,Currency,Balance Before,Balance After,Description,Status,Date";
  const csvRows = rows.map(r => {
    return `${r.id},${r.type},${r.amount},${card.currency},${r.balanceBefore},${r.balanceAfter},${sanitizeCsvCell(String(r.description))},${r.status},${r.createdAt}`;
  });
  const csv = [csvHeader, ...csvRows].join("\n");

  const filename = `balance-history-card-${cardId}-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

router.post("/cards/:cardId/access-url", requireAuth, async (req, res): Promise<void> => {
  const params = CreateCardAccessUrlParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const card = await getCardByIdForUser(params.data.cardId, req.session.userId!);
  if (!card) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  res.json(CreateCardAccessUrlResponse.parse({
    url: `https://secure.example.com/card-details/${card.id}?token=stub-token`,
    expiresAt,
  }));
});

router.get("/cards/:cardId/balance-history", requireAuth, async (req, res): Promise<void> => {
  const params = GetCardBalanceHistoryParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const entries = await getCardBalanceHistory(params.data.cardId, req.session.userId!);
  if (!entries) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(GetCardBalanceHistoryResponse.parse(entries.map(t => ({
    id: t.id,
    cardId: t.cardId,
    userId: t.userId,
    type: t.type as "topup" | "fee" | "refund",
    amount: t.amount,
    balanceBefore: t.balanceBefore,
    balanceAfter: t.balanceAfter,
    description: t.description ?? null,
    status: t.status as "pending" | "completed" | "failed",
    createdAt: t.createdAt,
  }))));
});

router.put("/cards/:cardId/contacts", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCardContactsParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = UpdateCardContactsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const result = await updateCardContacts(
    params.data.cardId,
    req.session.userId!,
    body.data.email,
    body.data.phoneNumber,
    body.data.phoneDialCode,
    body.data.applyToAll,
  );

  if (!result) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json(UpdateCardContactsResponse.parse({
    message: body.data.applyToAll
      ? `Contact details updated for ${result.updatedCount} card(s)`
      : "Contact details updated successfully",
    updatedCount: result.updatedCount,
  }));
});

export default router;
