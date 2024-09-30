export type Event = {
  id: string;
  title: string;
  event_type: string;
  owner_id: string;
  max_participants: number;
  participant_ids: string[];
  purpose: string;
  requirements: string;
  deadline: Date;
  created_at: Date;
  updated_at: Date | null;
};
