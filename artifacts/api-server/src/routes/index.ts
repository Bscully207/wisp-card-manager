import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import cardsRouter from "./cards";
import transactionsRouter from "./transactions";
import notificationsRouter from "./notifications";
import shippingRouter from "./shipping";
import supportRouter from "./support";
import telegramRouter from "./telegram";
import jobsRouter from "./jobs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(cardsRouter);
router.use(transactionsRouter);
router.use(notificationsRouter);
router.use(shippingRouter);
router.use(supportRouter);
router.use(telegramRouter);
router.use(jobsRouter);

export default router;
