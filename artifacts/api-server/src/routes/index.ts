import { Router, type IRouter } from "express";
import healthRouter from "./health";
import templatesRouter from "./templates";
import agentsRouter from "./agents";
import workroomsRouter from "./workrooms";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(templatesRouter);
router.use(agentsRouter);
router.use(workroomsRouter);
router.use(insightsRouter);

export default router;
