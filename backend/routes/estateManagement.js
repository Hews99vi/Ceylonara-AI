import express from 'express';
import auth from '../middleware/auth.js';
import Estate from '../models/estate.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to check MongoDB connection
const checkMongoConnection = () => {
  return new Promise((resolve, reject) => {
    const state = mongoose.connection.readyState;
    console.log('MongoDB connection state:', state);
    
    switch (state) {
      case 1:
        resolve(); // Connected
        break;
      case 2:
        reject(new Error('MongoDB is connecting - please try again in a moment'));
        break;
      case 3:
        reject(new Error('MongoDB is disconnecting'));
        break;
      case 0:
      default:
        reject(new Error('MongoDB is not connected'));
        break;
    }
  });
};

// Get all estates for a user
router.get('/estates', auth, async (req, res) => {
  try {
    await checkMongoConnection();
    const estates = await Estate.find({ userId: req.auth.userId });
    res.json(estates);
  } catch (error) {
    console.error('Error fetching estates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch estates',
      details: error.message 
    });
  }
});

// Get all estates for a user (alternative endpoint)
router.get('/', auth, async (req, res) => {
  try {
    await checkMongoConnection();
    const estates = await Estate.find({ userId: req.auth.userId });
    res.json(estates);
  } catch (error) {
    console.error('Error fetching estates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch estates',
      details: error.message 
    });
  }
});

// Create new estate
router.post('/', auth, async (req, res) => {
  try {
    await checkMongoConnection();
    
    const { name, location, area } = req.body;
    
    // Validate required fields
    if (!name || !location || !area) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['name', 'location', 'area'],
        received: { name, location, area }
      });
    }

    // Check if estate already exists for this user
    const existingEstate = await Estate.findOne({ 
      userId: req.auth.userId,
      name: name 
    });

    if (existingEstate) {
      return res.status(409).json({
        message: 'An estate with this name already exists'
      });
    }

    // Create new estate
    const estate = new Estate({
      userId: req.auth.userId,
      name,
      location,
      area: Number(area),
      metrics: {
        totalArea: Number(area),
        activePlots: 0,
        workerCount: 0,
        equipmentCount: 0
      },
      plots: [],
      resources: {
        workers: [],
        equipment: []
      },
      production: [],
      financial: {
        revenue: 0,
        expenses: 0,
        profit: 0,
        roi: 0
      }
    });

    const savedEstate = await estate.save();
    res.status(201).json(savedEstate);
  } catch (error) {
    console.error('Error creating estate:', error);
    res.status(500).json({ 
      message: 'Failed to create estate',
      details: error.message 
    });
  }
});

// Get available worker roles
router.get('/worker-roles', auth, async (req, res) => {
  try {
    const roles = Estate.schema.path('resources.workers.0.role.enum');
    res.json(roles);
  } catch (error) {
    console.error('Error fetching worker roles:', error);
    res.status(500).json({ 
      message: 'Failed to fetch worker roles',
      details: error.message 
    });
  }
});

// Get available equipment types
router.get('/equipment-types', auth, async (req, res) => {
  try {
    const types = Estate.schema.path('resources.equipment.0.type.enum');
    res.json(types);
  } catch (error) {
    console.error('Error fetching equipment types:', error);
    res.status(500).json({ 
      message: 'Failed to fetch equipment types',
      details: error.message 
    });
  }
});

// Add workers to an estate
router.post('/:estateId/workers', auth, async (req, res) => {
  try {
    const { role, count, status } = req.body;
    const { estateId } = req.params;
    
    console.log('Received worker request:', { role, count, status, estateId });
    
    // Validate required fields
    if (!role || !count || !status) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['role', 'count', 'status'],
        received: { role, count, status }
      });
    }

    // Validate count is a positive number
    const workerCount = Number(count);
    if (isNaN(workerCount) || workerCount < 1) {
      return res.status(400).json({
        message: 'Invalid worker count',
        details: 'Count must be a positive number',
        received: count
      });
    }

    // Validate role is from predefined list
    const validRoles = [
      'Field Supervisor',
      'Tea Plucker',
      'Machine Operator',
      'Quality Inspector',
      'Maintenance Worker',
      'Processing Worker',
      'Field Worker',
      'Transport Worker',
      'Storage Worker'
    ];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid worker role',
        validRoles: validRoles,
        received: role
      });
    }

    // Validate status
    const validStatuses = ['Active', 'On Leave', 'Training'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid worker status',
        validStatuses: validStatuses,
        received: status
      });
    }

    // Find estate and validate ownership
    const estate = await Estate.findOne({ 
      _id: estateId,
      userId: req.auth.userId 
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate not found' });
    }
    
    // Create new worker document
    const newWorker = {
      role,
      count: workerCount,
      status,
      estateId: estate._id
    };

    // Add to estate's workers array
    estate.resources.workers.push(newWorker);
    
    // Update metrics manually
    estate.metrics.workerCount += workerCount;
    
    // Save estate
    const savedEstate = await estate.save();
    
    // Return the newly added worker
    const addedWorker = savedEstate.resources.workers[savedEstate.resources.workers.length - 1];
    
    console.log('Worker added successfully:', addedWorker);
    res.status(201).json(addedWorker);
  } catch (error) {
    console.error('Error adding workers:', error);
    res.status(500).json({ 
      message: 'Failed to add workers',
      details: error.message 
    });
  }
});

// Add equipment to an estate
router.post('/:estateId/equipment', auth, async (req, res) => {
  try {
    const { type, count, status } = req.body;
    const { estateId } = req.params;
    
    console.log('Received equipment request:', { type, count, status, estateId });
    
    // Validate required fields
    if (!type || !count || !status) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['type', 'count', 'status'],
        received: { type, count, status }
      });
    }

    // Validate count is a positive number
    const equipmentCount = Number(count);
    if (isNaN(equipmentCount) || equipmentCount < 1) {
      return res.status(400).json({
        message: 'Invalid equipment count',
        details: 'Count must be a positive number',
        received: count
      });
    }

    // Validate type is from predefined list
    const validTypes = [
      'Plucking Machine',
      'Processing Machine',
      'Transport Vehicle',
      'Storage Equipment',
      'Irrigation System',
      'Fertilizer Spreader',
      'Pruning Machine',
      'Quality Testing Equipment',
      'Safety Equipment'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: 'Invalid equipment type',
        validTypes: validTypes,
        received: type
      });
    }

    // Validate status
    const validStatuses = ['Operational', 'Maintenance', 'Out of Service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid equipment status',
        validStatuses: validStatuses,
        received: status
      });
    }

    // Find estate and validate ownership
    const estate = await Estate.findOne({ 
      _id: estateId,
      userId: req.auth.userId 
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate not found' });
    }
    
    // Create new equipment document
    const newEquipment = {
      type,
      count: equipmentCount,
      status,
      estateId: estate._id
    };

    // Add to estate's equipment array
    estate.resources.equipment.push(newEquipment);
    
    // Update metrics manually
    estate.metrics.equipmentCount += equipmentCount;
    
    // Save estate
    const savedEstate = await estate.save();
    
    // Return the newly added equipment
    const addedEquipment = savedEstate.resources.equipment[savedEstate.resources.equipment.length - 1];
    
    console.log('Equipment added successfully:', addedEquipment);
    res.status(201).json(addedEquipment);
  } catch (error) {
    console.error('Error adding equipment:', error);
    res.status(500).json({ 
      message: 'Failed to add equipment',
      details: error.message 
    });
  }
});

// Delete worker from an estate
router.delete('/:estateId/workers/:workerId', auth, async (req, res) => {
  try {
    const estate = await Estate.findOne({
      _id: req.params.estateId,
      userId: req.auth.userId,
      'resources.workers._id': req.params.workerId
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate or worker not found' });
    }
    
    const worker = estate.resources.workers.id(req.params.workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    estate.metrics.workerCount -= worker.count;
    estate.resources.workers.pull(req.params.workerId);
    await estate.save();
    
    res.json({ message: 'Worker removed successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ 
      message: 'Failed to delete worker',
      details: error.message 
    });
  }
});

// Delete equipment from an estate
router.delete('/:estateId/equipment/:equipmentId', auth, async (req, res) => {
  try {
    const estate = await Estate.findOne({
      _id: req.params.estateId,
      userId: req.auth.userId,
      'resources.equipment._id': req.params.equipmentId
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate or equipment not found' });
    }

    const equipment = estate.resources.equipment.id(req.params.equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    estate.metrics.equipmentCount -= equipment.count;
    estate.resources.equipment.pull(req.params.equipmentId);
    await estate.save();
    
    res.json({ message: 'Equipment removed successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ 
      message: 'Failed to delete equipment',
      details: error.message 
    });
  }
});

// Transfer resource between estates
router.post('/transfer', auth, async (req, res) => {
  try {
    const { fromEstateId, toEstateId, resourceType, resourceId } = req.body;

    // Validate required fields
    if (!fromEstateId || !toEstateId || !resourceType || !resourceId) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['fromEstateId', 'toEstateId', 'resourceType', 'resourceId']
      });
    }

    // Validate resource type
    if (!['workers', 'equipment'].includes(resourceType)) {
      return res.status(400).json({
        message: 'Invalid resource type',
        validTypes: ['workers', 'equipment']
      });
    }

    // Find source and destination estates
    const [fromEstate, toEstate] = await Promise.all([
      Estate.findOne({ _id: fromEstateId, userId: req.auth.userId }),
      Estate.findOne({ _id: toEstateId, userId: req.auth.userId })
    ]);

    if (!fromEstate || !toEstate) {
      return res.status(404).json({ message: 'One or both estates not found' });
    }

    // Find the resource to transfer
    const resource = fromEstate.resources[resourceType].id(resourceId);
    if (!resource) {
      return res.status(404).json({ message: `${resourceType} not found` });
    }

    // Create a copy of the resource for the new estate
    const transferredResource = {
      ...resource.toObject(),
      _id: new mongoose.Types.ObjectId(),
      estateId: toEstate._id
    };

    // Remove from source estate and add to destination estate
    fromEstate.resources[resourceType].pull(resourceId);
    toEstate.resources[resourceType].push(transferredResource);

    // Update metrics
    if (resourceType === 'workers') {
      fromEstate.metrics.workerCount -= resource.count;
      toEstate.metrics.workerCount += resource.count;
    } else {
      fromEstate.metrics.equipmentCount -= resource.count;
      toEstate.metrics.equipmentCount += resource.count;
    }

    // Save both estates
    await Promise.all([fromEstate.save(), toEstate.save()]);

    res.json({
      message: `${resourceType} transferred successfully`,
      transferredResource
    });
  } catch (error) {
    console.error('Error transferring resource:', error);
    res.status(500).json({ 
      message: 'Failed to transfer resource',
      details: error.message 
    });
  }
});

// Delete an estate
router.delete('/:estateId', auth, async (req, res) => {
  try {
    const estate = await Estate.findOne({
      _id: req.params.estateId,
      userId: req.auth.userId
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate not found' });
    }

    await Estate.findByIdAndDelete(req.params.estateId);
    res.json({ message: 'Estate deleted successfully' });
  } catch (error) {
    console.error('Error deleting estate:', error);
    res.status(500).json({ 
      message: 'Failed to delete estate',
      details: error.message 
    });
  }
});

// Update estate details
router.put('/:estateId', auth, async (req, res) => {
  try {
    const { name, location, area } = req.body;
    
    // Validate required fields
    if (!name || !location || !area) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['name', 'location', 'area'],
        received: { name, location, area }
      });
    }

    // Check if estate exists and belongs to user
    const estate = await Estate.findOne({
      _id: req.params.estateId,
      userId: req.auth.userId
    });

    if (!estate) {
      return res.status(404).json({ message: 'Estate not found' });
    }

    // Check if new name conflicts with existing estate (excluding current estate)
    const existingEstate = await Estate.findOne({
      userId: req.auth.userId,
      name: name,
      _id: { $ne: req.params.estateId }
    });

    if (existingEstate) {
      return res.status(409).json({
        message: 'An estate with this name already exists'
      });
    }

    // Update estate
    estate.name = name;
    estate.location = location;
    estate.area = Number(area);
    estate.metrics.totalArea = Number(area);
    estate.updatedAt = new Date();

    const updatedEstate = await estate.save();
    res.json(updatedEstate);
  } catch (error) {
    console.error('Error updating estate:', error);
    res.status(500).json({ 
      message: 'Failed to update estate',
      details: error.message 
    });
  }
});

// Update worker in an estate
router.put('/:estateId/workers/:workerId', auth, async (req, res) => {
  try {
    const { role, count, status } = req.body;
    
    // Validate required fields
    if (!role || !count || !status) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['role', 'count', 'status'],
        received: { role, count, status }
      });
    }

    // Validate count is a positive number
    const workerCount = Number(count);
    if (isNaN(workerCount) || workerCount < 1) {
      return res.status(400).json({
        message: 'Invalid worker count',
        details: 'Count must be a positive number',
        received: count
      });
    }

    // Validate role is from predefined list
    const validRoles = [
      'Field Supervisor',
      'Tea Plucker',
      'Machine Operator',
      'Quality Inspector',
      'Maintenance Worker',
      'Processing Worker',
      'Field Worker',
      'Transport Worker',
      'Storage Worker'
    ];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid worker role',
        validRoles: validRoles,
        received: role
      });
    }

    // Validate status
    const validStatuses = ['Active', 'On Leave', 'Training'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid worker status',
        validStatuses: validStatuses,
        received: status
      });
    }

    // Find estate and validate ownership
    const estate = await Estate.findOne({
      _id: req.params.estateId,
      userId: req.auth.userId,
      'resources.workers._id': req.params.workerId
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate or worker not found' });
    }

    // Find the worker to update
    const worker = estate.resources.workers.id(req.params.workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Update worker metrics
    estate.metrics.workerCount -= worker.count;
    estate.metrics.workerCount += workerCount;

    // Update worker
    worker.role = role;
    worker.count = workerCount;
    worker.status = status;

    // Save estate
    await estate.save();
    
    res.json(worker);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ 
      message: 'Failed to update worker',
      details: error.message 
    });
  }
});

// Update equipment in an estate
router.put('/:estateId/equipment/:equipmentId', auth, async (req, res) => {
  try {
    const { type, count, status } = req.body;
    
    // Validate required fields
    if (!type || !count || !status) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['type', 'count', 'status'],
        received: { type, count, status }
      });
    }

    // Validate count is a positive number
    const equipmentCount = Number(count);
    if (isNaN(equipmentCount) || equipmentCount < 1) {
      return res.status(400).json({
        message: 'Invalid equipment count',
        details: 'Count must be a positive number',
        received: count
      });
    }

    // Validate type is from predefined list
    const validTypes = [
      'Plucking Machine',
      'Processing Machine',
      'Transport Vehicle',
      'Storage Equipment',
      'Irrigation System',
      'Fertilizer Spreader',
      'Pruning Machine',
      'Quality Testing Equipment',
      'Safety Equipment'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: 'Invalid equipment type',
        validTypes: validTypes,
        received: type
      });
    }

    // Validate status
    const validStatuses = ['Operational', 'Maintenance', 'Out of Service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid equipment status',
        validStatuses: validStatuses,
        received: status
      });
    }

    // Find estate and validate ownership
    const estate = await Estate.findOne({
      _id: req.params.estateId,
      userId: req.auth.userId,
      'resources.equipment._id': req.params.equipmentId
    });
    
    if (!estate) {
      return res.status(404).json({ message: 'Estate or equipment not found' });
    }

    // Find the equipment to update
    const equipment = estate.resources.equipment.id(req.params.equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Update equipment metrics
    estate.metrics.equipmentCount -= equipment.count;
    estate.metrics.equipmentCount += equipmentCount;

    // Update equipment
    equipment.type = type;
    equipment.count = equipmentCount;
    equipment.status = status;

    // Save estate
    await estate.save();
    
    res.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ 
      message: 'Failed to update equipment',
      details: error.message 
    });
  }
});

export default router; 