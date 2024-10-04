export type StarRanking = {
  id: string;
  created_at: Date;
  updated_at: Date | null;
  user_id: string;
  total_stats: number;
  rank: number;
};
