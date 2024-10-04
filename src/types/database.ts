import { Match } from "../models/matchModel.js";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";
import { Like } from "../models/likeModel.js";
import { Event } from "../models/eventModel.js";
import { ContributionRanking } from "../models/contributionRankingModel.js";
import { StarRanking } from "../models/starRankingModel.js";
import { QiitaRanking } from "../models/qiitaRankingModel.js";

export interface Database {
  public: {
    Tables: {
      Match: {
        Row: Match;
      };
      User: {
        Row: User;
      };
      Like: {
        Row: Like;
      };
      Message: {
        Row: Message;
      };
      Event: {
        Row: Event;
      };
      DailyGithubContributionRanking: {
        Row: ContributionRanking;
      };
      WeeklyGithubContributionRanking: {
        Row: ContributionRanking;
      };
      MonthlyGithubContributionRanking: {
        Row: ContributionRanking;
      };
      DailyGithubContributionStarRanking: {
        Row: StarRanking;
      };
      WeeklyGithubContributionStarRanking: {
        Row: StarRanking;
      };
      MonthlyGithubContributionStarRanking: {
        Row: StarRanking;
      };
      DailyQiitaRanking: {
        Row: QiitaRanking;
      };
      WeeklyQiitaRanking: {
        Row: QiitaRanking;
      };
      MonthlyQiitaRanking: {
        Row: QiitaRanking;
      };
    };
  };
}
