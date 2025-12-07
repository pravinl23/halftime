export interface Demographics {
  age: number;
  country: string;
  tags: string[];
}

export interface InterestScores {
  onsite_score: number;
  x_segment_score: number;
}

export interface Interest {
  topic: string;
  interest: 'low' | 'medium' | 'high';
  source: ('onsite' | 'x_segment')[];
}

export interface UserProfile {
  user_id: string;
  demographics: Demographics;
  interests: Interest[];
}

export interface User {
  id: string;
  demographics: Demographics;
  onsite_scores: Record<string, number>;
  x_segment_scores: Record<string, number>;
}

