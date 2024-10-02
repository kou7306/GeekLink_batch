import { Router } from "express";
import {
  updateDailyRanking,
  updateRanking,
} from "../controllers/rankingController.js";

const router = Router();

router.post("/ranking-update", updateRanking);
router.post("/ranking-update-daily", updateDailyRanking);

export default router;
