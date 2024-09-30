export interface Post {
  id: string;
  userid: string;
  content: string;
  timestamp: Date;
  reactions: {
    [emoji: string]: string[]; // 配列を使用
  };
}
