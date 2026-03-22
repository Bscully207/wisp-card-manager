import { db, pool, cardsTable, transactionsTable, usersTable } from "@workspace/db";
import type { CardType, CardStatus } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const CARD_COLORS = ["blue", "purple", "green", "orange", "pink", "teal"];

export function generateCardNumber(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(Math.floor(1000 + Math.random() * 9000).toString());
  }
  return segments.join(" ");
}

export function generateCvv(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

export function toCardResponse(card: typeof cardsTable.$inferSelect) {
  return {
    id: card.id,
    userId: card.userId,
    type: card.type as CardType,
    cardNumber: card.cardNumber,
    cardholderName: card.cardholderName,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    cvv: card.cvv,
    balance: card.balance,
    currency: card.currency,
    status: card.status as CardStatus,
    label: card.label ?? null,
    color: card.color ?? null,
    createdAt: card.createdAt,
  };
}

export async function getUserCards(userId: number) {
  return db.select().from(cardsTable).where(eq(cardsTable.userId, userId));
}

export async function getCardByIdForUser(cardId: number, userId: number) {
  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId))
  );
  return card ?? null;
}

interface CreateCardOptions {
  userId: number;
  currency?: string;
  label?: string | null;
  color?: string | null;
  type?: CardType;
}

const MAX_CARD_RETRIES = 5;

export async function createCard({ userId, currency = "EUR", label, color, type = "virtual" }: CreateCardOptions) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const now = new Date();
  const defaultColor = CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];

  for (let attempt = 0; attempt < MAX_CARD_RETRIES; attempt++) {
    try {
      const [card] = await db.insert(cardsTable).values({
        userId,
        type,
        cardNumber: generateCardNumber(),
        cardholderName: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email.split("@")[0].toUpperCase(),
        expiryMonth: now.getMonth() + 1,
        expiryYear: now.getFullYear() + 4,
        cvv: generateCvv(),
        balance: 0,
        currency,
        status: "active",
        label: label ?? null,
        color: color ?? defaultColor,
      }).returning();
      return card;
    } catch (err: any) {
      const isUniqueViolation = err?.code === "23505";
      if (!isUniqueViolation || attempt === MAX_CARD_RETRIES - 1) throw err;
    }
  }

  throw new Error("Failed to generate unique card number");
}

export async function topUpCard(cardId: number, userId: number, amount: number, description?: string) {
  const card = await getCardByIdForUser(cardId, userId);
  if (!card) return { error: "not_found" as const };
  if (card.status === "frozen") return { error: "frozen" as const };

  const balanceBefore = card.balance;
  const balanceAfter = balanceBefore + amount;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const txDb = drizzle(client);

    const [updatedCard] = await txDb.update(cardsTable)
      .set({ balance: balanceAfter })
      .where(eq(cardsTable.id, card.id))
      .returning();

    await txDb.insert(transactionsTable).values({
      cardId: card.id,
      userId,
      type: "topup",
      amount,
      balanceBefore,
      balanceAfter,
      description: description ?? `Top up of ${amount} ${card.currency}`,
      status: "completed",
    });

    await client.query("COMMIT");
    return { card: updatedCard };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function freezeCard(cardId: number, userId: number, frozen: boolean) {
  const card = await getCardByIdForUser(cardId, userId);
  if (!card) return null;

  const newStatus: CardStatus = frozen ? "frozen" : "active";
  const [updatedCard] = await db.update(cardsTable)
    .set({ status: newStatus })
    .where(eq(cardsTable.id, card.id))
    .returning();

  return updatedCard;
}

export async function updateCardPin(cardId: number, userId: number, _pin: string) {
  const card = await getCardByIdForUser(cardId, userId);
  if (!card) return null;

  // Stubbed: In production, this would call the Kiml API:
  // PUT /card/update-card-pin { cardId, pin }
  return { success: true };
}

export async function deleteCard(cardId: number, userId: number) {
  const [card] = await db.delete(cardsTable).where(
    and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId))
  ).returning();
  return card ?? null;
}

export async function getCardTransactions(cardId: number, userId: number) {
  const card = await getCardByIdForUser(cardId, userId);
  if (!card) return null;

  return db.select().from(transactionsTable).where(eq(transactionsTable.cardId, card.id));
}
