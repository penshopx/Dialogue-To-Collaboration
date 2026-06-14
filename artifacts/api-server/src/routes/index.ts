import { Router, type IRouter } from "express";
import healthRouter from "./health";
import templatesRouter from "./templates";
import agentsRouter from "./agents";
import workroomsRouter from "./workrooms";
import insightsRouter from "./insights";
import agentRouter from "./agent";
import knowledgeRouter from "./knowledge";
import deliverablesRouter from "./deliverables";
import brainRouter from "./brain";
import configRouter from "./config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(templatesRouter);
router.use(agentsRouter);
router.use(workroomsRouter);
router.use(insightsRouter);
router.use(agentRouter);
router.use(knowledgeRouter);
router.use(deliverablesRouter);
router.use(brainRouter);
router.use(configRouter);

export default router;
