import { db, telegramLinksTable, cardsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function getTelegramLinkForCard(cardId: number, userId: number) {
  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId))
  );
  if (!card) return { error: "card_not_found" as const };

  const [link] = await db.select().from(telegramLinksTable).where(
    eq(telegramLinksTable.cardId, cardId)
  );
  return { link: link ?? null };
}

export async function linkTelegramToCard(
  cardId: number,
  userId: number,
  telegramId: string,
  telegramUsername: string | null,
  telegramFirstName: string | null,
) {
  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId))
  );
  if (!card) return { error: "card_not_found" as const };

  const [existing] = await db.select().from(telegramLinksTable).where(
    eq(telegramLinksTable.cardId, cardId)
  );
  if (existing) return { error: "already_linked" as const };

  try {
    const [link] = await db.insert(telegramLinksTable).values({
      cardId,
      userId,
      telegramId,
      telegramUsername,
      telegramFirstName,
    }).returning();

    return { link };
  } catch (err: any) {
    if (err?.code === "23505") return { error: "already_linked" as const };
    throw err;
  }
}

export async function unlinkTelegramFromCard(cardId: number, userId: number) {
  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId))
  );
  if (!card) return { error: "card_not_found" as const };

  const [deleted] = await db.delete(telegramLinksTable).where(
    and(
      eq(telegramLinksTable.cardId, cardId),
      eq(telegramLinksTable.userId, userId)
    )
  ).returning();

  if (!deleted) return { error: "not_linked" as const };
  return { success: true as const };
}
