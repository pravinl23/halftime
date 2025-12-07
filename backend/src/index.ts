import express from 'express';
import cors from 'cors';
import { getOrCreateUser, recordInterestEvent, getUser } from './store';
import { computeProfile } from './profile';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Login / create user session
app.post('/api/auth/login', (req, res) => {
  const { user_id, demographics } = req.body;
  const userId = user_id || 'demo_user';
  
  const user = getOrCreateUser(userId, demographics);
  
  res.json({
    success: true,
    user_id: user.id,
    message: 'Logged in successfully',
  });
});

// Record an interest event (user clicked on something)
app.post('/api/events/interest', (req, res) => {
  const { user_id, topic, delta } = req.body;
  
  if (!user_id || !topic) {
    return res.status(400).json({ error: 'user_id and topic are required' });
  }
  
  const user = recordInterestEvent(user_id, topic, delta || 5);
  
  res.json({
    success: true,
    topic,
    new_score: user.onsite_scores[topic],
  });
});

// Get user profile with computed interests
app.get('/api/me/profile', (req, res) => {
  const userId = req.query.user_id as string || 'demo_user';
  
  const user = getUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found. Please login first.' });
  }
  
  const profile = computeProfile(user);
  
  res.json(profile);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Halftime backend running on http://localhost:${PORT}`);
});

