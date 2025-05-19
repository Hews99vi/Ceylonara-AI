import express from 'express';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';
import Notification from '../models/notification.js';

const router = express.Router();

// Get all notifications for a user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.auth.userId 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notifications',
      details: error.message 
    });
  }
});

// Get unread notifications count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.auth.userId,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ 
      message: 'Failed to count unread notifications',
      details: error.message 
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.notificationId,
        userId: req.auth.userId
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark notification as read',
      details: error.message 
    });
  }
});

// Mark all notifications as read
router.patch('/read/all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { 
        userId: req.auth.userId,
        read: false
      },
      { read: true }
    );

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark all notifications as read',
      details: error.message 
    });
  }
});

// Delete a notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.auth.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      message: 'Failed to delete notification',
      details: error.message 
    });
  }
});

// Delete all read notifications
router.delete('/read/all', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.auth.userId,
      read: true
    });

    res.json({ 
      message: 'All read notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ 
      message: 'Failed to delete read notifications',
      details: error.message 
    });
  }
});

export default router; 