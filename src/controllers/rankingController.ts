import { Request, Response } from "express";
import { updateContributionRankingService } from "../services/rankingService.js";

export const updateRanking = async (req: Request, res: Response) => {
  try {
    await updateContributionRankingService();
    res.status(200).json({ message: "Likes created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
};
