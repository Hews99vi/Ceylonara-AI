import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import mongoose from 'mongoose';
import DirectChat from '../models/directChat.js';
import User from '../models/User.js';
import Farmer from '../models/farmer.js';
import Factory from '../models/factory.js';

const router = express.Router();

// Middleware to require authentication
router.use(ClerkExpressRequireAuth());

// Get all direct chats for the current user
router.get('/api/direct-chats', async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Find all chats where the user is a participant
    const chats = await DirectChat.find({
      'participants.userId': userId
    }).sort({ updatedAt: -1 });

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
    const { recipientId, recipientRole, recipientName, senderName, senderRole, initialMessage } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    // Check if a chat already exists between these users
    const existingChat = await DirectChat.findOne({
      $and: [
        { 'participants.userId': userId },
        { 'participants.userId': recipientId }
      ]
    });

    if (existingChat) {
      return res.json({ chat: existingChat });
    }

    // Create a new chat
    const newChat = new DirectChat({
      participants: [
        { userId, role: senderRole, name: senderName },
        { userId: recipientId, role: recipientRole, name: recipientName }
      ],
      messages: initialMessage ? [
        { sender: userId, text: initialMessage, timestamp: new Date(), read: false }
      ] : []
    });

    await newChat.save();
    res.status(201).json({ chat: newChat });
  } catch (error) {
    console.error('Error creating direct chat:', error);
    res.status(500).json({ error: 'Failed to create direct chat' });
  }
});

// Send a message in a direct chat
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

    // Add the new message
    chat.messages.push({
      sender: userId,
      text: message,
      timestamp: new Date(),
      read: false
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.json({ chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
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
    chat.messages.forEach(message => {
      if (message.sender !== userId && !message.read) {
        message.read = true;
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
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

export default router;
