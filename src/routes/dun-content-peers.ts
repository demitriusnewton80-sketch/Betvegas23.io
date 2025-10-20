
import express, { Request, Response } from 'express';
import { dunContentPeersService } from '../services/DunContentPeersService.js';

const router = express.Router();

// Get peer network overview
router.get('/network', (req: Request, res: Response) => {
  try {
    const network = dunContentPeersService.getPeerNetwork();
    res.json({
      success: true,
      ...network
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get network'
    });
  }
});

// Get specific peer details
router.get('/peer/:peerId', (req: Request, res: Response) => {
  try {
    const { peerId } = req.params;
    const details = dunContentPeersService.getPeerDetails(peerId);

    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Peer not found'
      });
    }

    res.json({
      success: true,
      ...details
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get peer details'
    });
  }
});

// Get DUNS entity information
router.get('/entity/:dunsNumber', (req: Request, res: Response) => {
  try {
    const { dunsNumber } = req.params;
    const entity = dunContentPeersService.getDUNSEntityInfo(dunsNumber);

    if (!entity) {
      return res.status(404).json({
        success: false,
        error: 'DUNS entity not found'
      });
    }

    res.json({
      success: true,
      entity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get entity'
    });
  }
});

// Register new DUNS entity
router.post('/entity/register', (req: Request, res: Response) => {
  try {
    const { dunsNumber, ...entityData } = req.body;

    if (!dunsNumber) {
      return res.status(400).json({
        success: false,
        error: 'DUNS number is required'
      });
    }

    const entity = dunContentPeersService.registerDUNSEntity(dunsNumber, entityData);

    res.json({
      success: true,
      entity,
      message: 'DUNS entity registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register entity'
    });
  }
});

// Create content peer
router.post('/peer/create', (req: Request, res: Response) => {
  try {
    const { dunsNumber, peerType } = req.body;

    if (!dunsNumber || !peerType) {
      return res.status(400).json({
        success: false,
        error: 'DUNS number and peer type are required'
      });
    }

    const peer = dunContentPeersService.createContentPeer(dunsNumber, peerType);

    if (!peer) {
      return res.status(404).json({
        success: false,
        error: 'Failed to create peer - entity not found'
      });
    }

    res.json({
      success: true,
      peer,
      message: 'Content peer created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create peer'
    });
  }
});

// Share content with peers
router.post('/content/share', (req: Request, res: Response) => {
  try {
    const { sourceEntity, contentType, data } = req.body;

    if (!sourceEntity || !contentType || !data) {
      return res.status(400).json({
        success: false,
        error: 'Source entity, content type, and data are required'
      });
    }

    const content = dunContentPeersService.shareContent(sourceEntity, contentType, data);

    res.json({
      success: true,
      content,
      message: 'Content shared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share content'
    });
  }
});

// Receive content from peer
router.post('/content/receive', (req: Request, res: Response) => {
  try {
    const { peerId, contentData } = req.body;

    if (!peerId || !contentData) {
      return res.status(400).json({
        success: false,
        error: 'Peer ID and content data are required'
      });
    }

    const success = dunContentPeersService.receiveContent(peerId, contentData);

    res.json({
      success,
      message: success ? 'Content received successfully' : 'Failed to receive content'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to receive content'
    });
  }
});

// Get content by type
router.get('/content/type/:contentType', (req: Request, res: Response) => {
  try {
    const { contentType } = req.params;
    const content = dunContentPeersService.getContentByType(contentType as any);

    res.json({
      success: true,
      contentType,
      count: content.length,
      content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get content'
    });
  }
});

// Update peer trust score
router.put('/peer/:peerId/trust', (req: Request, res: Response) => {
  try {
    const { peerId } = req.params;
    const { trustScore } = req.body;

    if (trustScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Trust score is required'
      });
    }

    const success = dunContentPeersService.updateTrustScore(peerId, trustScore);

    res.json({
      success,
      message: success ? 'Trust score updated' : 'Peer not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update trust score'
    });
  }
});

export default router;
