import express from 'express';
import { getRecommendations, performIntelligentSearch } from '../services/aiGatewayService.js';
import { logUserEvent, getAnalyticsSummary } from '../services/eventService.js';

const router = express.Router();

// Intelligent Search Endpoint
router.post('/search', async (req, res) => {
  try {
    const { query, userId, limit } = req.body;
    const result = await performIntelligentSearch({
      query,
      userId,
      limit: Number(limit) || 20
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[AI Search Route Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Personalized Recommendations Endpoint
router.post('/recommendations', async (req, res) => {
  try {
    const { userId, productId, limit } = req.body;
    const result = await getRecommendations({
      userId,
      productId,
      limit: Number(limit) || 8
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[AI Recommendations Route Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Behavioral Events Logging Endpoint
router.post('/events', async (req, res) => {
  try {
    const { userId, productId, eventType, metadata } = req.body;
    await logUserEvent({ userId, productId, eventType, metadata });
    return res.json({ success: true, message: 'Event logged' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// AI & Commerce Telemetry for Admin Dashboard
router.get('/analytics/summary', async (req, res) => {
  try {
    const summary = await getAnalyticsSummary();
    return res.json({ success: true, ...summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
