import { Match } from "../models/matchModel.js";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";
import { Like } from "../models/likeModel.js";
import { Event } from "../models/eventModel.js";

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
    };
  };
}
