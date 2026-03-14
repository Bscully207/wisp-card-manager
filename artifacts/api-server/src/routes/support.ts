import { Router, type IRouter } from "express";
import { db, supportTicketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetSupportTicketsResponse, CreateSupportTicketBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

function toTicketResponse(t: typeof supportTicketsTable.$inferSelect) {
  return {
    id: t.id,
    userId: t.userId,
    subject: t.subject,
    message: t.message,
    category: t.category as "billing" | "card" | "account" | "technical" | "other",
    status: t.status as "open" | "in_progress" | "resolved" | "closed",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

router.get("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const tickets = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.userId, req.session.userId!));
  res.json(GetSupportTicketsResponse.parse(tickets.map(toTicketResponse)));
});

router.post("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSupportTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [ticket] = await db.insert(supportTicketsTable).values({
    userId: req.session.userId!,
    subject: parsed.data.subject,
    message: parsed.data.message,
    category: parsed.data.category,
    status: "open",
  }).returning();

  res.status(201).json(toTicketResponse(ticket));
});

export default router;
