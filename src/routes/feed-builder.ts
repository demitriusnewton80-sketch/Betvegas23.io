
import express, { Request, Response } from 'express';
import { feedBuilderService } from '../services/FeedBuilderService.js';

const router = express.Router();

// Get available sources
router.get('/sources', (req: Request, res: Response) => {
  const sources = feedBuilderService.getAvailableSources();
  
  res.json({
    success: true,
    sources,
    count: sources.length,
    fccEntity: '20130314143016'
  });
});

// Get user's feeds
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const feeds = feedBuilderService.getUserFeeds(userId);
  
  res.json({
    success: true,
    userId,
    feeds,
    count: feeds.length,
    fccEntity: '20130314143016'
  });
});

// Create new feed
router.post('/create', (req: Request, res: Response) => {
  const { userId, feedName, sources, filters } = req.body;

  if (!userId || !feedName || !sources) {
    return res.status(400).json({
      error: 'Missing required fields: userId, feedName, sources'
    });
  }

  const feed = feedBuilderService.createFeed(userId, feedName, sources, filters);
  
  res.json({
    success: true,
    feed,
    message: 'Feed created successfully',
    fccEntity: '20130314143016'
  });
});

// Update feed
router.put('/update/:feedId', (req: Request, res: Response) => {
  const { feedId } = req.params;
  const { userId, ...updates } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const updatedFeed = feedBuilderService.updateFeed(userId, feedId, updates);
  
  if (!updatedFeed) {
    return res.status(404).json({ error: 'Feed not found' });
  }

  res.json({
    success: true,
    feed: updatedFeed,
    fccEntity: '20130314143016'
  });
});

// Delete feed
router.delete('/delete/:feedId', (req: Request, res: Response) => {
  const { feedId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const deleted = feedBuilderService.deleteFeed(userId, feedId);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Feed not found' });
  }

  res.json({
    success: true,
    message: 'Feed deleted successfully',
    fccEntity: '20130314143016'
  });
});

// Get feed data
router.get('/data/:feedId', async (req: Request, res: Response) => {
  const { feedId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const feedData = await feedBuilderService.getFeedData(feedId, userId as string);
  
  if (!feedData) {
    return res.status(404).json({ error: 'Feed not found' });
  }

  res.json({
    success: true,
    data: feedData,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
