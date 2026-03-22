import { Router, type IRouter } from "express";
import {
  CreateShippingRequestBody,
  GetShippingRequestsQueryParams,
  GetShippingRequestsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  createShipping,
  getShippingRequests,
  toShippingResponse,
} from "../services/shipping.service.js";

const router: IRouter = Router();

router.get("/shipping", requireAuth, async (req, res): Promise<void> => {
  const params = GetShippingRequestsQueryParams.safeParse({
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });

  const page = params.success && params.data.page ? params.data.page : 1;
  const limit = params.success && params.data.limit ? params.data.limit : 10;
  const status = params.success ? params.data.status : undefined;

  const result = await getShippingRequests({
    userId: req.session.userId!,
    status: status as any,
    page,
    limit,
  });

  res.json(GetShippingRequestsResponse.parse({
    items: result.items.map(toShippingResponse),
    total: result.total,
    page: result.page,
    limit: result.limit,
  }));
});

router.post("/shipping", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateShippingRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const result = await createShipping({
    cardId: parsed.data.cardId,
    userId: req.session.userId!,
    recipientName: parsed.data.recipientName,
    address: parsed.data.address,
    city: parsed.data.city,
    country: parsed.data.country,
    zipCode: parsed.data.zipCode,
  });

  if ("error" in result) {
    if (result.error === "card_not_found") {
      res.status(404).json({ error: "Not found", message: "Card not found" });
    } else if (result.error === "not_physical") {
      res.status(400).json({ error: "Bad request", message: "Card is not a physical card" });
    } else {
      res.status(400).json({ error: "Bad request", message: "Card is not in a valid state for shipping" });
    }
    return;
  }

  res.status(201).json(toShippingResponse(result.shipping));
});

export default router;
