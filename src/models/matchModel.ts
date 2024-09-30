export type Match = {
  id: number;
  user1_id: string;
  user2_id: string;
  created_at: Date;
};

export type CreateMatch = {
  user1_id: string;
  user2_id: string;
  created_at: Date;
};
