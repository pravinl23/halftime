const API_BASE = '/api';

export interface Demographics {
  age: number;
  country: string;
  tags: string[];
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

export async function login(userId: string, demographics?: Demographics): Promise<{ success: boolean; user_id: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, demographics }),
  });
  return res.json();
}

export async function recordInterest(userId: string, topic: string, delta: number = 5): Promise<{ success: boolean; topic: string; new_score: number }> {
  const res = await fetch(`${API_BASE}/events/interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, topic, delta }),
  });
  return res.json();
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/me/profile?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }
  return res.json();
}

