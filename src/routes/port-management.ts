
import express, { Request, Response } from 'express';
import { portManagementCore } from '../core/PortManagementCore.js';

const router = express.Router();

// Get port landscape overview
router.get('/landscape', (req: Request, res: Response) => {
  const landscape = portManagementCore.getPortLandscape();
  
  res.json({
    success: true,
    ...landscape,
    timestamp: new Date().toISOString()
  });
});

// Get specific port status
router.get('/port/:port', (req: Request, res: Response) => {
  const port = parseInt(req.params.port);
  const status = portManagementCore.getPortStatus(port);
  
  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'Port not found'
    });
  }
  
  res.json({
    success: true,
    port: status,
    fccEntity: '20130314143016'
  });
});

// Get all bypass routes
router.get('/bypasses', (req: Request, res: Response) => {
  const bypasses = portManagementCore.getAllBypassRoutes();
  
  res.json({
    success: true,
    bypasses,
    count: bypasses.length,
    fccEntity: '20130314143016'
  });
});

// Bind structure to port
router.post('/bind', (req: Request, res: Response) => {
  const { structureId, port } = req.body;
  
  if (!structureId || !port) {
    return res.status(400).json({
      success: false,
      error: 'structureId and port required'
    });
  }
  
  const result = portManagementCore.bindStructureToPort(structureId, parseInt(port));
  
  res.json({
    ...result,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
