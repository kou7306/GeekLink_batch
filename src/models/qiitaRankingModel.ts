export type QiitaRanking = {
  id: number;
  created_at: Date;
  updated_at: Date | null;
  user_id: string;
  score: number;
  rank: number;
};
