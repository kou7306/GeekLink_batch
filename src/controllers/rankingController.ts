import { Request, Response } from "express";
import {
  updateDailyContributionRanking,
  updateWeeklyContributionRanking,
  updateMonthlyContributionRanking,
} from "../services/updateContributionRankingService.js";
import {
  updateDailyContributionStarRanking,
  updateWeeklyContributionStarRanking,
  updateMonthlyContributionStarRanking,
} from "../services/updateContributionStarRankingService.js";
import {
  updateDailyQiitaRanking,
  updateWeeklyQiitaRanking,
  updateMonthlyQiitaRanking,
} from "../services/updateQiitaRankingService.js";

export const updateRanking = async (req: Request, res: Response) => {
  try {
    await updateWeeklyContributionRanking();
    await updateMonthlyContributionRanking();
    await updateWeeklyContributionStarRanking();
    await updateMonthlyContributionStarRanking();
    await updateWeeklyQiitaRanking();
    await updateMonthlyQiitaRanking();
    res.status(200).json({ message: "Raning Updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
};

export const updateDailyRanking = async (req: Request, res: Response) => {
  try {
    await updateDailyContributionRanking();
    await updateDailyContributionStarRanking();
    await updateDailyQiitaRanking();
    res.status(200).json({ message: "Raning Updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
};
