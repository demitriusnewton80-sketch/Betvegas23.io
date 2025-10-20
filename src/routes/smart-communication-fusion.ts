
import express, { Request, Response } from 'express';
import { smartCommunicationFusion } from '../core/SmartCommunicationFusion.js';

const router = express.Router();

// Get fusion status
router.get('/status', (req: Request, res: Response) => {
  const status = smartCommunicationFusion.getFusionStatus();
  
  res.json({
    success: true,
    fusion: status
  });
});

// Execute troubleshooting command
router.post('/command', (req: Request, res: Response) => {
  const { command, target } = req.body;

  if (!command || !target) {
    return res.status(400).json({
      success: false,
      error: 'command and target are required'
    });
  }

  const result = smartCommunicationFusion.executeTroubleshootingCommand(command, target);

  res.json({
    success: true,
    command: result,
    fccEntity: '20130314143016'
  });
});

// Register new communication channel
router.post('/channels', (req: Request, res: Response) => {
  const { id, type, endpoint } = req.body;

  if (!id || !type || !endpoint) {
    return res.status(400).json({
      success: false,
      error: 'id, type, and endpoint are required'
    });
  }

  smartCommunicationFusion.registerChannel(id, type, endpoint);

  res.json({
    success: true,
    message: 'Channel registered',
    channelId: id,
    fccEntity: '20130314143016'
  });
});

// Get all channels
router.get('/channels', (req: Request, res: Response) => {
  const channels = smartCommunicationFusion.getAllChannels();

  res.json({
    success: true,
    channels,
    count: channels.length,
    fccEntity: '20130314143016'
  });
});

// Get channel status
router.get('/channels/:channelId', (req: Request, res: Response) => {
  const { channelId } = req.params;
  const channel = smartCommunicationFusion.getChannelStatus(channelId);

  if (!channel) {
    return res.status(404).json({
      success: false,
      error: 'Channel not found'
    });
  }

  res.json({
    success: true,
    channel,
    fccEntity: '20130314143016'
  });
});

// Get command history
router.get('/commands/history', (req: Request, res: Response) => {
  const history = smartCommunicationFusion.getCommandHistory();

  res.json({
    success: true,
    commands: history,
    count: history.length,
    fccEntity: '20130314143016'
  });
});

// Toggle auto-repair
router.post('/auto-repair', (req: Request, res: Response) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'enabled must be a boolean'
    });
  }

  smartCommunicationFusion.setAutoRepair(enabled);

  res.json({
    success: true,
    autoRepair: enabled,
    fccEntity: '20130314143016'
  });
});

export default router;
