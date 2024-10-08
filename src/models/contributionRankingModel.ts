export type ContributionRanking = {
  id: number;
  created_at: Date;
  updated_at: Date | null;
  user_id: string;
  contribution_count: number;
  rank: number;
};
