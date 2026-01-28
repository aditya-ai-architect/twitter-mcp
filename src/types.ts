export interface Tweet {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
    verified?: boolean;
  };
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
  views?: number;
  language?: string;
  in_reply_to_tweet_id?: string;
  conversation_id?: string;
  media?: Array<{
    type: string;
    url: string;
    preview_url?: string;
  }>;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  description: string;
  profile_image_url: string;
  profile_banner_url?: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  created_at: string;
  location?: string;
  url?: string;
}

export interface TrendItem {
  name: string;
  tweet_count?: number;
  description?: string;
  domain?: string;
}
