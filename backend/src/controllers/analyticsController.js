import { getFullAnalytics, calculateCityHealthScore } from '../services/analyticsService.js';
import { db } from '../models/db.js';

export function getAnalytics(req, res) {
  try {
    const data = getFullAnalytics();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
}

export function getHealthScore(req, res) {
  try {
    const health = calculateCityHealthScore();
    return res.json(health);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute city health score' });
  }
}

export function getDepartments(req, res) {
  try {
    const departments = db.departments.list();
    return res.json({ departments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve departments' });
  }
}
