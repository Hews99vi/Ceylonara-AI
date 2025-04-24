import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';
import Farmer from '../models/farmer.js';
import Factory from '../models/factory.js';

const router = express.Router();

// Middleware to require authentication
router.use(ClerkExpressRequireAuth());

// Get users by role
router.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role || !['farmer', 'factory', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role parameter is required' });
    }
    
    // For direct messaging, we need to get users from the Farmer or Factory collections
    // since they contain more detailed information
    let users = [];
    
    if (role === 'farmer') {
      const farmers = await Farmer.find({});
      users = farmers.map(farmer => ({
        userId: farmer.userId,
        name: farmer.farmerName,
        role: 'farmer',
        address: farmer.address
      }));
    } else if (role === 'factory') {
      const factories = await Factory.find({});
      users = factories.map(factory => ({
        userId: factory.userId,
        name: factory.factoryName,
        role: 'factory',
        address: factory.address
      }));
    } else {
      // For admin users, use the User model
      const adminUsers = await User.find({ role: 'admin' });
      users = adminUsers.map(user => ({
        userId: user.userId,
        name: user.name,
        role: 'admin'
      }));
    }
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a specific user by ID
router.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Try to find the user in the Farmer collection
    let user = await Farmer.findOne({ userId });
    if (user) {
      return res.json({
        userId: user.userId,
        name: user.farmerName,
        role: 'farmer',
        address: user.address
      });
    }
    
    // Try to find the user in the Factory collection
    user = await Factory.findOne({ userId });
    if (user) {
      return res.json({
        userId: user.userId,
        name: user.factoryName,
        role: 'factory',
        address: user.address
      });
    }
    
    // Try to find the user in the User collection
    user = await User.findOne({ userId });
    if (user) {
      return res.json({
        userId: user.userId,
        name: user.name,
        role: user.role
      });
    }
    
    return res.status(404).json({ error: 'User not found' });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
