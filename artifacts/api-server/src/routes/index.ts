import { Router, type IRouter } from "express";
import healthRouter from "./health";
import templatesRouter from "./templates";
import agentsRouter from "./agents";
import workroomsRouter from "./workrooms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(templatesRouter);
router.use(agentsRouter);
router.use(workroomsRouter);

export default router;
