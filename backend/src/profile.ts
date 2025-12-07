import { User, UserProfile, Interest } from './types';

function scoreToLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

export function computeProfile(user: User): UserProfile {
  // Collect all topics from both sources
  const allTopics = new Set<string>([
    ...Object.keys(user.onsite_scores),
    ...Object.keys(user.x_segment_scores),
  ]);

  const interests: Interest[] = [];

  for (const topic of allTopics) {
    const onsiteScore = user.onsite_scores[topic] || 0;
    const xSegmentScore = user.x_segment_scores[topic] || 0;
    const combinedScore = onsiteScore + xSegmentScore;

    // Only include if there's meaningful interest
    if (combinedScore < 5) continue;

    const sources: ('onsite' | 'x_segment')[] = [];
    if (onsiteScore > 0) sources.push('onsite');
    if (xSegmentScore > 0) sources.push('x_segment');

    interests.push({
      topic,
      interest: scoreToLevel(combinedScore),
      source: sources,
    });
  }

  // Sort by combined score (highest first)
  interests.sort((a, b) => {
    const scoreA = (user.onsite_scores[a.topic] || 0) + (user.x_segment_scores[a.topic] || 0);
    const scoreB = (user.onsite_scores[b.topic] || 0) + (user.x_segment_scores[b.topic] || 0);
    return scoreB - scoreA;
  });

  return {
    user_id: user.id,
    demographics: user.demographics,
    interests,
  };
}

