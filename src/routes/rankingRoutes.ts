import { Router } from "express";
import { updateRanking } from "../controllers/rankingController.js";

const router = Router();

router.post("/ranking-update", updateRanking);

export default router;
