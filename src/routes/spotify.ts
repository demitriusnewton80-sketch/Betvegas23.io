
import express, { Request, Response } from 'express';
import { spotifyService } from '../services/SpotifyService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  (req as any).user = user;
  next();
};

// Connect Spotify account (OAuth callback)
router.post('/connect', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { accessToken, refreshToken, expiresIn } = req.body;

  if (!accessToken || !refreshToken) {
    return res.status(400).json({ error: 'Missing Spotify tokens' });
  }

  spotifyService.connectSpotify(user.id, accessToken, refreshToken, expiresIn || 3600);

  res.json({
    message: 'Spotify account connected',
    userId: user.id,
    connected: true
  });
});

// Check connection status
router.get('/status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const connected = spotifyService.isConnected(user.id);

  res.json({
    connected,
    userId: user.id,
    fccEntity: '20130314143016'
  });
});

// Upload Spotify content
router.post('/upload', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { spotifyId, type, name, metadata } = req.body;

  if (!spotifyId || !type || !name) {
    return res.status(400).json({ error: 'Missing required fields: spotifyId, type, name' });
  }

  if (!['track', 'playlist', 'album'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be track, playlist, or album' });
  }

  const result = spotifyService.uploadContent(user, {
    id: spotifyId,
    type: type as 'track' | 'playlist' | 'album',
    name,
    metadata: metadata || {}
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Content uploaded successfully',
    upload: result.upload
  });
});

// Get user's uploads
router.get('/uploads', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const uploads = spotifyService.getUserUploads(user.id);

  res.json({
    uploads,
    count: uploads.length,
    userId: user.id
  });
});

// Get specific upload
router.get('/uploads/:uploadId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { uploadId } = req.params;
  
  const upload = spotifyService.getUpload(uploadId);

  if (!upload) {
    return res.status(404).json({ error: 'Upload not found' });
  }

  if (upload.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ upload });
});

// Delete upload
router.delete('/uploads/:uploadId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { uploadId } = req.params;

  const success = spotifyService.deleteUpload(user.id, uploadId);

  if (!success) {
    return res.status(404).json({ error: 'Upload not found or access denied' });
  }

  res.json({
    message: 'Upload deleted successfully',
    uploadId
  });
});

// Fetch data from Spotify
router.get('/fetch/:type/:spotifyId', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { type, spotifyId } = req.params;

  if (!['track', 'playlist', 'album'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    const data = await spotifyService.fetchSpotifyData(
      user.id,
      spotifyId,
      type as 'track' | 'playlist' | 'album'
    );

    res.json({ data });
  } catch (error) {
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch Spotify data' 
    });
  }
});

export default router;
