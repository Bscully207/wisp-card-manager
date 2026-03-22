import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import cardsRouter from "./cards";
import transactionsRouter from "./transactions";
import notificationsRouter from "./notifications";
import supportRouter from "./support";
import telegramRouter from "./telegram";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(cardsRouter);
router.use(transactionsRouter);
router.use(notificationsRouter);
router.use(supportRouter);
router.use(telegramRouter);

export default router;
