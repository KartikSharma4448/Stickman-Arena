import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import friendsRouter from "./friends";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/friends", friendsRouter);

export default router;
