export type ContributionRanking = {
  id: string;
  created_at: Date;
  updated_at: Date | null;
  user_id: string;
  contribution_count: number;
  rank: number;
};
