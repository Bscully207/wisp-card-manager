import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import cardsRouter from "./cards";
import transactionsRouter from "./transactions";
import supportRouter from "./support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(cardsRouter);
router.use(transactionsRouter);
router.use(supportRouter);

export default router;
