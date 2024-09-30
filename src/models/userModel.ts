export type User = {
  user_id: string;
  created_at: Date;
  name: string;
  sex: string;
  age: string;
  place: string;
  top_tech: string;
  top_teches: string[];
  teches: string[];
  hobby?: string;
  occupation?: string;
  affiliation?: string;
  qualification: string[];
  editor?: string;
  github?: string;
  twitter?: string;
  qiita?: string;
  zenn?: string;
  atcoder?: string;
  message?: string;
  updated_at: Date;
  portfolio?: string;
  graduate?: string;
  desired_occupation?: string;
  faculty?: string;
  experience: string[];
  image_url?: string;
  qiita_access_token?: string;
  github_access_token?: string;
};

export type TopUserResponse = {
  user_id: string;
  name: string;
  top_teches: string[];
  image_url: string;
};

export type UserRandomResponse = {
  user_id: string;
  name: string;
  sex: string;
  age: string;
  place: string;
  occupation: string;
  top_teches: string[];
  image_url: string;
};

export type MessageUserResponse = {
  user_id: string;
  name: string;
  sex: string;
  age: string;
  top_teches: string[];
  image_url: string;
};

export type RequestUserID = {
  uuid: string;
};
