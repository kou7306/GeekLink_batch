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

export const updateRanking = async (req: Request, res: Response) => {
  try {
    await updateWeeklyContributionRanking();
    await updateMonthlyContributionRanking();
    await updateWeeklyContributionStarRanking();
    await updateMonthlyContributionStarRanking();
    res.status(200).json({ message: "Likes created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
};

export const updateDailyRanking = async (req: Request, res: Response) => {
  try {
    await updateDailyContributionRanking();
    await updateDailyContributionStarRanking();
    res.status(200).json({ message: "Likes created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
};
