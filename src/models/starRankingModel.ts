export type StarRanking = {
  id: number;
  created_at: Date;
  updated_at: Date | null;
  user_id: string;
  total_stats: number;
  rank: number;
};
