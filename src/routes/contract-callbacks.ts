
import express, { Request, Response } from 'express';
import { contractCallbackService } from '../services/ContractCallbackService.js';
import { functionalStructures } from '../core/FunctionalStructures.js';

const router = express.Router();

// Get all contracts
router.get('/contracts', (req: Request, res: Response) => {
  const contracts = contractCallbackService.getAllContracts();

  res.json({
    success: true,
    contracts,
    count: contracts.length,
    fccEntity: '20130314143016'
  });
});

// Get specific contract
router.get('/contracts/:id', (req: Request, res: Response) => {
  const contract = contractCallbackService.getContract(req.params.id);

  if (!contract) {
    return res.status(404).json({
      success: false,
      error: 'Contract not found'
    });
  }

  const callbacks = contractCallbackService.getContractCallbacks(req.params.id);
  const structure = functionalStructures.getStructure(contract.structureId);

  res.json({
    success: true,
    contract,
    callbacks,
    structure,
    fccEntity: '20130314143016'
  });
});

// Register new contract
router.post('/contracts', (req: Request, res: Response) => {
  const { name, provider, structureId, hostnames, callbackEndpoint } = req.body;

  if (!name || !provider || !structureId || !hostnames || !callbackEndpoint) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    const contract = contractCallbackService.registerContract({
      name,
      provider,
      structureId,
      hostnames,
      callbackEndpoint,
      fccEntity: '20130314143016',
      status: 'active'
    });

    res.json({
      success: true,
      contract,
      message: 'Contract registered successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Contract registration failed'
    });
  }
});

// Create hostname callback
router.post('/callbacks', (req: Request, res: Response) => {
  const { contractId, hostname, callbackUrl } = req.body;

  if (!contractId || !hostname || !callbackUrl) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    const callback = contractCallbackService.createCallback(
      contractId,
      hostname,
      callbackUrl
    );

    res.json({
      success: true,
      callback,
      message: 'Callback created successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Callback creation failed'
    });
  }
});

// Get callback by hostname
router.get('/callbacks/hostname/:hostname', (req: Request, res: Response) => {
  const callback = contractCallbackService.getCallbackByHostname(req.params.hostname);

  if (!callback) {
    return res.status(404).json({
      success: false,
      error: 'Callback not found for hostname'
    });
  }

  const contract = contractCallbackService.getContract(callback.contractId);
  const structure = functionalStructures.getStructure(callback.structureId);

  res.json({
    success: true,
    callback,
    contract,
    structure,
    fccEntity: '20130314143016'
  });
});

// Get contract metrics
router.get('/metrics', (req: Request, res: Response) => {
  const metrics = contractCallbackService.getContractMetrics();

  res.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString()
  });
});

// Update callback status
router.patch('/callbacks/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status required'
    });
  }

  try {
    contractCallbackService.updateCallbackStatus(req.params.id, status);

    res.json({
      success: true,
      message: 'Callback status updated',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Status update failed'
    });
  }
});

// FCC compliance check
router.get('/fcc-compliance', (req: Request, res: Response) => {
  const contracts = contractCallbackService.getAllContracts();
  const metrics = contractCallbackService.getContractMetrics();

  const compliance = {
    fccEntity: '20130314143016',
    allContractsCompliant: contracts.every(c => c.fccEntity === '20130314143016'),
    compliantCallbacks: metrics.fccCompliant,
    totalCallbacks: metrics.totalCallbacks,
    compliancePercentage: Math.round((metrics.fccCompliant / metrics.totalCallbacks) * 100) || 0,
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    compliance
  });
});

export default router;
