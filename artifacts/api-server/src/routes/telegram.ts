import { Router, type IRouter } from "express";
import {
  GetCardTelegramParams,
  LinkTelegramParams,
  LinkTelegramBody,
  UnlinkTelegramParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  getTelegramLinkForCard,
  linkTelegramToCard,
  unlinkTelegramFromCard,
} from "../services/telegram.service.js";

const router: IRouter = Router();

function parseCardId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

router.get("/cards/:cardId/telegram", requireAuth, async (req, res): Promise<void> => {
  const params = GetCardTelegramParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const result = await getTelegramLinkForCard(params.data.cardId, req.session.userId!);
  if ("error" in result) {
    res.status(404).json({ error: "Not found", message: "Card not found" });
    return;
  }

  res.json({ linked: !!result.link, telegramLink: result.link });
});

router.post("/cards/:cardId/telegram/link", requireAuth, async (req, res): Promise<void> => {
  const params = LinkTelegramParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const body = LinkTelegramBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation error", message: body.error.message });
    return;
  }

  const result = await linkTelegramToCard(
    params.data.cardId,
    req.session.userId!,
    body.data.telegramId,
    body.data.telegramUsername ?? null,
    body.data.telegramFirstName ?? null,
  );

  if ("error" in result) {
    if (result.error === "card_not_found") {
      res.status(404).json({ error: "Not found", message: "Card not found" });
    } else {
      res.status(409).json({ error: "Conflict", message: "A Telegram account is already linked to this card" });
    }
    return;
  }

  res.status(201).json({ linked: true, telegramLink: result.link });
});

router.post("/cards/:cardId/telegram/unlink", requireAuth, async (req, res): Promise<void> => {
  const params = UnlinkTelegramParams.safeParse({ cardId: parseCardId(req.params.cardId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid card ID" });
    return;
  }

  const result = await unlinkTelegramFromCard(params.data.cardId, req.session.userId!);
  if ("error" in result) {
    if (result.error === "card_not_found") {
      res.status(404).json({ error: "Not found", message: "Card not found" });
    } else {
      res.status(404).json({ error: "Not found", message: "No Telegram account linked to this card" });
    }
    return;
  }

  res.json({ linked: false, telegramLink: null });
});

export default router;
