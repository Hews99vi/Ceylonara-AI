import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import DirectChat from '../models/directChat.js';
import User from '../models/User.js';
import Farmer from '../models/farmer.js';
import Factory from '../models/factory.js';
import Notification from '../models/notification.js';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/chat-files');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log(`Storing file in: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = uniqueSuffix + path.extname(file.originalname);
    console.log(`Generated filename: ${fileName} from original: ${file.originalname}`);
    cb(null, fileName);
  }
});

// File filter function to accept images, PDFs, and common document formats
const fileFilter = (req, file, cb) => {
  console.log(`Received file: ${file.originalname}, mimetype: ${file.mimetype}`);
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and common document formats are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handler for multer
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`Multer error: ${err.message}`);
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`
    });
  } else if (err) {
    console.error(`Upload error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: `Upload failed: ${err.message}`
    });
  }
  next();
};

const router = express.Router();

// Middleware to require authentication
router.use(ClerkExpressRequireAuth());

// Get all direct chats for the current user
router.get('/api/direct-chats', async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log("Fetching chats for user:", userId);

    // Find all chats where the user is a participant
    const chats = await DirectChat.find({
      'participants.userId': userId
    }).sort({ updatedAt: -1 });

    console.log(`Found ${chats.length} chats for user ${userId}`);

    // Check user's role for debugging
    const farmer = await Farmer.findOne({ userId });
    const factory = await Factory.findOne({ userId });
    console.log(`User is a farmer: ${!!farmer}, User is a factory: ${!!factory}`);

    // Log the participants of each chat for debugging
    chats.forEach((chat, index) => {
      console.log(`Chat ${index + 1} participants:`, chat.participants.map(p => ({
        id: p.userId,
        name: p.name,
        role: p.role
      })));

      // Verify participant names
      chat.participants.forEach(async (participant) => {
        if (participant.role === 'farmer') {
          const farmerDoc = await Farmer.findOne({ userId: participant.userId });
          if (farmerDoc && participant.name !== farmerDoc.farmerName) {
            console.log(`Warning: Farmer name mismatch in chat ${chat._id}. Chat has "${participant.name}" but should be "${farmerDoc.farmerName}"`);
          }
        } else if (participant.role === 'factory') {
          const factoryDoc = await Factory.findOne({ userId: participant.userId });
          if (factoryDoc && participant.name !== factoryDoc.factoryName) {
            console.log(`Warning: Factory name mismatch in chat ${chat._id}. Chat has "${participant.name}" but should be "${factoryDoc.factoryName}"`);
          }
        }
      });
    });

    res.json({ chats });
  } catch (error) {
    console.error('Error fetching direct chats:', error);
    res.status(500).json({ error: 'Failed to fetch direct chats' });
  }
});

// Get a specific direct chat
router.get('/api/direct-chats/:chatId', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { chatId } = req.params;

    // Find the chat and ensure the user is a participant
    const chat = await DirectChat.findOne({
      _id: chatId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Error fetching direct chat:', error);
    res.status(500).json({ error: 'Failed to fetch direct chat' });
  }
});

// Create a new direct chat
router.post('/api/direct-chats', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({ error: 'Partner ID is required' });
    }

    // Check if a chat already exists between these users
    const existingChat = await DirectChat.findOne({
      $and: [
        { 'participants.userId': userId },
        { 'participants.userId': partnerId }
      ]
    });

    if (existingChat) {
      return res.json({ chat: existingChat });
    }

    // Determine current user's role and name
    let senderRole = '';
    let senderName = '';
    const currentUserFarmer = await Farmer.findOne({ userId });
    const currentUserFactory = await Factory.findOne({ userId });

    if (currentUserFarmer) {
      senderRole = 'farmer';
      senderName = currentUserFarmer.farmerName;
    } else if (currentUserFactory) {
      senderRole = 'factory';
      senderName = currentUserFactory.factoryName;
    } else {
      return res.status(404).json({ error: 'Your user profile was not found' });
    }

    // Determine partner's role and name
    let partnerRole = '';
    let partnerName = '';
    const partnerFarmer = await Farmer.findOne({ userId: partnerId });
    const partnerFactory = await Factory.findOne({ userId: partnerId });

    if (partnerFarmer) {
      partnerRole = 'farmer';
      partnerName = partnerFarmer.farmerName;
    } else if (partnerFactory) {
      partnerRole = 'factory';
      partnerName = partnerFactory.factoryName;
    } else {
      return res.status(404).json({ error: 'Partner user profile was not found' });
    }

    // Create a new chat with actual names
    const newChat = new DirectChat({
      participants: [
        { userId, role: senderRole, name: senderName },
        { userId: partnerId, role: partnerRole, name: partnerName }
      ],
      messages: []
    });

    await newChat.save();
    res.status(201).json({ chat: newChat });
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ error: 'Failed to create direct chat' });
  }
});

// Send a text message in a direct chat
router.post('/api/direct-chats/:chatId/messages', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Find the chat and ensure the user is a participant
    const chat = await DirectChat.findOne({
      _id: chatId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if messaging is disabled for either participant
    const isMessagingDisabled = chat.participants.some(p => p.messagingDisabled);
    if (isMessagingDisabled) {
      return res.status(403).json({ error: 'Messaging has been disabled for this conversation' });
    }

    // Add the new message
    chat.messages.push({
      sender: userId,
      text: message,
      messageType: 'text',
      timestamp: new Date(),
      read: false
    });

    // Update last message preview for chat list
    chat.lastMessagePreview = message.length > 30 ? message.substring(0, 30) + '...' : message;
    chat.lastMessageAt = new Date();
    chat.updatedAt = new Date();
    await chat.save();

    // Create notification for the other participant
    const recipient = chat.participants.find(p => p.userId !== userId);
    if (recipient) {
      const sender = chat.participants.find(p => p.userId === userId);
      const notification = new Notification({
        userId: recipient.userId,
        type: 'message',
        title: 'New message',
        content: `${sender.name} sent you a message: "${message.length > 30 ? message.substring(0, 30) + '...' : message}"`,
        sourceId: sender.userId,
        sourceName: sender.name,
        sourceType: sender.role,
        link: `/dashboard/direct-messages/${chat._id}`
      });
      await notification.save();
    }

    res.json({ chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send a file message in a direct chat
router.post('/api/direct-chats/:chatId/file-messages', upload.single('file'), uploadErrorHandler, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { chatId } = req.params;
    const { message } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Find the chat and ensure the user is a participant
    const chat = await DirectChat.findOne({
      _id: chatId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if messaging is disabled for either participant
    const isMessagingDisabled = chat.participants.some(p => p.messagingDisabled);
    if (isMessagingDisabled) {
      // Delete the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(403).json({ error: 'Messaging has been disabled for this conversation' });
    }

    // Determine file type (image or document)
    const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    // Create file URL
    const fileUrl = `/uploads/chat-files/${req.file.filename}`;

    // Add the new message
    chat.messages.push({
      sender: userId,
      text: message || `Sent a ${messageType}`,
      messageType: messageType,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      timestamp: new Date(),
      read: false
    });

    // Update last message preview
    chat.lastMessagePreview = message || `Sent a ${messageType}`;
    chat.lastMessageAt = new Date();
    chat.updatedAt = new Date();
    await chat.save();

    // Create notification for the other participant
    const recipient = chat.participants.find(p => p.userId !== userId);
    if (recipient) {
      const sender = chat.participants.find(p => p.userId === userId);
      const notification = new Notification({
        userId: recipient.userId,
        type: 'message',
        title: 'New file shared',
        content: `${sender.name} sent you a ${messageType}: ${req.file.originalname}`,
        sourceId: sender.userId,
        sourceName: sender.name,
        sourceType: sender.role,
        link: `/dashboard/direct-messages/${chat._id}`
      });
      await notification.save();
    }

    res.json({ chat });
  } catch (error) {
    console.error('Error sending file message:', error);

    // Delete the uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ error: 'Failed to send file message' });
  }
});

// Mark all messages in a chat as read
router.put('/api/direct-chats/:chatId/read', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { chatId } = req.params;

    // Find the chat and ensure the user is a participant
    const chat = await DirectChat.findOne({
      _id: chatId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark all messages from other participants as read
    let updated = false;
    const now = new Date();

    chat.messages.forEach(message => {
      if (message.sender !== userId && !message.read) {
        message.read = true;
        message.readAt = now;
        updated = true;
      }
    });

    if (updated) {
      // Update the participant's last seen time
      const participantIndex = chat.participants.findIndex(p => p.userId === userId);
      if (participantIndex !== -1) {
        chat.participants[participantIndex].lastSeen = now;
      }

      await chat.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Toggle messaging disabled status for a participant
router.put('/api/direct-chats/:chatId/toggle-messaging', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { chatId } = req.params;
    const { disabled } = req.body;

    if (disabled === undefined) {
      return res.status(400).json({ error: 'Disabled status is required' });
    }

    // Find the chat and ensure the user is a participant
    const chat = await DirectChat.findOne({
      _id: chatId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Update the participant's messaging disabled status
    const participantIndex = chat.participants.findIndex(p => p.userId === userId);
    if (participantIndex !== -1) {
      chat.participants[participantIndex].messagingDisabled = !!disabled;
      await chat.save();
    } else {
      return res.status(404).json({ error: 'Participant not found in chat' });
    }

    res.json({
      success: true,
      message: `Messaging has been ${disabled ? 'disabled' : 'enabled'} for this conversation`
    });
  } catch (error) {
    console.error('Error toggling messaging status:', error);
    res.status(500).json({ error: 'Failed to update messaging preferences' });
  }
});

// Get notifications for the current user
router.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    // Build query
    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      notifications,
      pagination: {
        total,
        unreadCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notifications as read
router.put('/api/notifications/read', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Notification IDs array is required' });
    }

    // Mark specified notifications as read
    const result = await Notification.updateMany(
      {
        _id: { $in: ids },
        userId: userId // Ensure user can only mark their own notifications
      },
      {
        $set: { read: true }
      }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Mark all notifications as read
router.put('/api/notifications/read-all', async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Mark all user's notifications as read
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get all farmers or factories (for chat partner selection)
router.get('/api/chat-partners', async (req, res) => {
  try {
    const userId = req.auth.userId;
    // Determine user's role first
    let userRole = '';
    const farmer = await Farmer.findOne({ userId });
    const factory = await Factory.findOne({ userId });

    if (farmer) userRole = 'farmer';
    else if (factory) userRole = 'factory';
    else return res.status(400).json({ success: false, message: "User must be registered as a farmer or factory" });

    // If user is a farmer, get factories. If user is a factory, get farmers.
    let partners = [];
    if (userRole === 'farmer') {
      const factories = await Factory.find({}, 'userId factoryName address');
      partners = factories.map(f => ({
        userId: f.userId,
        name: f.factoryName,
        address: f.address,
        role: 'factory'
      }));
    } else {
      const farmers = await Farmer.find({}, 'userId farmerName address');
      partners = farmers.map(f => ({
        userId: f.userId,
        name: f.farmerName,
        address: f.address,
        role: 'farmer'
      }));
    }

    res.status(200).json({ success: true, partners });
  } catch (error) {
    console.error('Error fetching chat partners:', error);
    res.status(500).json({ success: false, message: "Failed to fetch chat partners", error: error.message });
  }
});

// Delete a direct chat
router.delete('/api/direct-chats/:chatId', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { chatId } = req.params;

    // Find the chat and ensure the user is a participant
    const chat = await DirectChat.findOne({
      _id: chatId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or you do not have permission to delete it' });
    }

    // Delete the chat
    await DirectChat.findByIdAndDelete(chatId);

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting direct chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Migration endpoint to fix existing chats with proper names
router.put('/api/fix-direct-chats', async (req, res) => {
  try {
    console.log("Running fix-direct-chats migration");
    const chats = await DirectChat.find({});
    let updatedCount = 0;
    let errors = [];

    for (const chat of chats) {
      let updated = false;
      console.log(`Processing chat ${chat._id} with ${chat.participants.length} participants`);

      // Fix each participant's name
      for (const participant of chat.participants) {
        const userId = participant.userId;
        const role = participant.role;

        console.log(`Checking participant ${userId} with role ${role}`);

        try {
          if (role === 'farmer') {
            const farmer = await Farmer.findOne({ userId });
            if (farmer) {
              console.log(`Found farmer ${farmer.farmerName} for userId ${userId}`);
              if (participant.name !== farmer.farmerName) {
                console.log(`Updating name from "${participant.name}" to "${farmer.farmerName}"`);
                participant.name = farmer.farmerName;
                updated = true;
              }
            } else {
              console.log(`No farmer found for userId ${userId}`);
              errors.push(`No farmer found for userId ${userId}`);
            }
          } else if (role === 'factory') {
            const factory = await Factory.findOne({ userId });
            if (factory) {
              console.log(`Found factory ${factory.factoryName} for userId ${userId}`);
              if (participant.name !== factory.factoryName) {
                console.log(`Updating name from "${participant.name}" to "${factory.factoryName}"`);
                participant.name = factory.factoryName;
                updated = true;
              }
            } else {
              console.log(`No factory found for userId ${userId}`);
              errors.push(`No factory found for userId ${userId}`);
            }
          } else {
            console.log(`Unknown role ${role} for userId ${userId}`);
            errors.push(`Unknown role ${role} for userId ${userId}`);
          }
        } catch (err) {
          console.error(`Error processing participant ${userId}:`, err);
          errors.push(`Error processing participant ${userId}: ${err.message}`);
        }
      }

      if (updated) {
        try {
          await chat.save();
          console.log(`Successfully updated chat ${chat._id}`);
          updatedCount++;
        } catch (err) {
          console.error(`Error saving chat ${chat._id}:`, err);
          errors.push(`Error saving chat ${chat._id}: ${err.message}`);
        }
      } else {
        console.log(`No updates needed for chat ${chat._id}`);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedCount} chats`,
      totalChats: chats.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error fixing direct chats:', error);
    res.status(500).json({ error: 'Failed to fix direct chats', message: error.message });
  }
});

export default router;
