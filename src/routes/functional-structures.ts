
import express, { Request, Response } from 'express';
import { functionalStructures } from '../core/FunctionalStructures.js';

const router = express.Router();

// Get all functional structures
router.get('/structures', (req: Request, res: Response) => {
  const structures = functionalStructures.getAllStructures();

  res.json({
    success: true,
    structures,
    count: structures.length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get specific structure
router.get('/structures/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const structure = functionalStructures.getStructure(id);

  if (!structure) {
    return res.status(404).json({
      success: false,
      error: 'Structure not found'
    });
  }

  res.json({
    success: true,
    structure,
    fccEntity: '20130314143016'
  });
});

// Get all modules
router.get('/modules', (req: Request, res: Response) => {
  const modules = functionalStructures.getAllModules();

  res.json({
    success: true,
    modules,
    count: modules.length,
    fccEntity: '20130314143016'
  });
});

// Get specific module
router.get('/modules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const module = functionalStructures.getModule(id);

  if (!module) {
    return res.status(404).json({
      success: false,
      error: 'Module not found'
    });
  }

  res.json({
    success: true,
    module,
    fccEntity: '20130314143016'
  });
});

// Get overall structure status
router.get('/status', (req: Request, res: Response) => {
  const status = functionalStructures.getStructureStatus();

  res.json({
    success: true,
    ...status,
    timestamp: new Date().toISOString()
  });
});

// Execute module function
router.post('/execute', (req: Request, res: Response) => {
  const { moduleId, functionName, params } = req.body;

  if (!moduleId || !functionName) {
    return res.status(400).json({
      success: false,
      error: 'moduleId and functionName are required'
    });
  }

  const result = functionalStructures.executeFunction(moduleId, functionName, params);

  res.json({
    ...result,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get structure visualizations
router.get('/visualize', (req: Request, res: Response) => {
  const structures = functionalStructures.getAllStructures();
  
  const visualization = structures.map(structure => ({
    name: structure.name,
    powerLevel: structure.powerLevel,
    operational: structure.operational,
    modules: structure.modules.map(m => ({
      name: m.name,
      type: m.type,
      status: m.status,
      functions: m.functions.length
    }))
  }));

  res.json({
    success: true,
    visualization,
    fccEntity: '20130314143016'
  });
});

export default router;
