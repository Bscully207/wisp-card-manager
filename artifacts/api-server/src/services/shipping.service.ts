import { db, shippingTable, cardsTable } from "@workspace/db";
import type { ShippingStatus } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

export function toShippingResponse(shipping: typeof shippingTable.$inferSelect) {
  return {
    id: shipping.id,
    cardId: shipping.cardId,
    userId: shipping.userId,
    status: shipping.status as ShippingStatus,
    recipientName: shipping.recipientName,
    address: shipping.address,
    city: shipping.city,
    country: shipping.country,
    zipCode: shipping.zipCode,
    trackingNumber: shipping.trackingNumber ?? null,
    createdAt: shipping.createdAt,
    updatedAt: shipping.updatedAt,
  };
}

interface CreateShippingOptions {
  cardId: number;
  userId: number;
  recipientName: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
}

export async function createShipping(options: CreateShippingOptions) {
  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, options.cardId), eq(cardsTable.userId, options.userId))
  );
  if (!card) return { error: "card_not_found" as const };
  if (card.type !== "physical") return { error: "not_physical" as const };
  if (card.status !== "active" && card.status !== "pending_activation") return { error: "invalid_status" as const };

  const [shipping] = await db.insert(shippingTable).values({
    cardId: options.cardId,
    userId: options.userId,
    status: "in_review",
    recipientName: options.recipientName,
    address: options.address,
    city: options.city,
    country: options.country,
    zipCode: options.zipCode,
  }).returning();

  return { shipping };
}

interface GetShippingOptions {
  userId: number;
  status?: ShippingStatus;
  page: number;
  limit: number;
}

export async function getShippingRequests({ userId, status, page, limit }: GetShippingOptions) {
  const conditions = [eq(shippingTable.userId, userId)];
  if (status) {
    conditions.push(eq(shippingTable.status, status));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [items, [countResult]] = await Promise.all([
    db.select().from(shippingTable)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(shippingTable.createdAt),
    db.select({ count: count() }).from(shippingTable).where(whereClause),
  ]);

  return {
    items,
    total: countResult?.count ?? 0,
    page,
    limit,
  };
}
