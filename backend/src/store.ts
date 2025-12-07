import { User, Demographics } from './types';

// In-memory store for users
const users: Map<string, User> = new Map();

// Default X/Grok segment priors based on demographic tags
const SEGMENT_PRIORS: Record<string, Record<string, number>> = {
  cs_student: {
    computer_science: 14,
    xbox: 8,
    gaming: 12,
    anime: 6,
    ai: 10,
    coding: 15,
  },
  gamer: {
    xbox: 10,
    gaming: 15,
    computer_science: 6,
    anime: 8,
    streaming: 10,
    esports: 12,
  },
  default: {
    dolls: 8,
    fashion: 5,
    music: 7,
    movies: 6,
  },
};

function computeXSegmentScores(tags: string[]): Record<string, number> {
  const scores: Record<string, number> = {};
  
  // Apply default priors
  for (const [topic, score] of Object.entries(SEGMENT_PRIORS.default)) {
    scores[topic] = (scores[topic] || 0) + score;
  }
  
  // Apply tag-specific priors
  for (const tag of tags) {
    const priors = SEGMENT_PRIORS[tag];
    if (priors) {
      for (const [topic, score] of Object.entries(priors)) {
        scores[topic] = (scores[topic] || 0) + score;
      }
    }
  }
  
  return scores;
}

export function getOrCreateUser(userId: string, demographics?: Demographics): User {
  let user = users.get(userId);
  
  if (!user) {
    const defaultDemographics: Demographics = demographics || {
      age: 21,
      country: 'US',
      tags: ['cs_student', 'gamer'],
    };
    
    user = {
      id: userId,
      demographics: defaultDemographics,
      onsite_scores: {},
      x_segment_scores: computeXSegmentScores(defaultDemographics.tags),
    };
    users.set(userId, user);
  }
  
  return user;
}

export function recordInterestEvent(userId: string, topic: string, delta: number = 5): User {
  const user = getOrCreateUser(userId);
  user.onsite_scores[topic] = (user.onsite_scores[topic] || 0) + delta;
  return user;
}

export function getUser(userId: string): User | undefined {
  return users.get(userId);
}

