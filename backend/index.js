import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { clerkClient, ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Chat from "./models/chat.js";
import Message from "./models/message.js";
import ImageKit from "imagekit";
import UserChats from "./models/userChats.js";
import path from "path";
import { fileURLToPath } from "url";
import ensureDirectories from "./utils/ensureDirectories.js";
import { spawn } from "child_process";
import fs from "fs";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the new HarvestData model
import HarvestData from "./models/harvestData.js";

// Import the Factory model
import Factory from './models/factory.js';

// Import the Farmer model
import Farmer from './models/farmer.js';

// Import the Average Price model
import AveragePrice from './models/averagePrice.js';

// DirectChat model is imported in directChatRoutes.js

// Import the User model
import User from "./models/User.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import directChatRoutes from "./routes/directChatRoutes.js";

// Create a new Price model for storing tea prices
const priceSchema = new mongoose.Schema({
  factoryId: {
    type: String,
    required: true
  },
  factoryName: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Price = mongoose.model('Price', priceSchema);

// Create a new Announcement model for storing factory announcements
const announcementSchema = new mongoose.Schema({
  factoryId: {
    type: String,
    required: true
  },
  factoryName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null,
    // Set a large size limit for image data URLs
    maxlength: 5000000
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

// Create a new Collection Request model for tea leaf collection requests
const collectionRequestSchema = new mongoose.Schema({
  factoryId: {
    type: String,
    required: true
  },
  factoryName: {
    type: String,
    required: true
  },
  farmerId: {
    type: String,
    required: true
  },
  farmerName: {
    type: String,
    required: true
  },
  nicNumber: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String
  },
  note: {
    type: String
  },
  location: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    },
    address: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CollectionRequest = mongoose.model('CollectionRequest', collectionRequestSchema);

dotenv.config();

const app = express();
const PORT = 3002;

// For future Socket.io implementation
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ['http://localhost:5173', 'http://localhost:5174'],
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

// Connect to MongoDB
console.log("Connecting to MongoDB...");
// Create a connection string for local MongoDB if environment variable isn't set
const mongoConnectionString = process.env.MONGO || 'mongodb://localhost:27017/ceylonara';
console.log("Using connection string:", mongoConnectionString.includes('localhost') ? 'Local MongoDB connection' : 'Remote MongoDB connection');

mongoose
  .connect(mongoConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
});

// Ensure required directories exist
ensureDirectories();

// Middleware
// Update middleware configuration
app.use(express.json({ limit: '50mb' }));

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
}));

// Add body-parser middleware with increased limit for URL-encoded data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public route for getting average tea prices for farmers/factories - placed before auth middleware
app.get("/api/tea-prices/average", async (req, res) => {
  try {
    // Get current month and year if not specified
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1; // 1-12
    const year = parseInt(req.query.year) || now.getFullYear();

    // Find current month's average price
    const averagePrice = await AveragePrice.findOne({
      month: month,
      year: year
    });

    // Return consistent response with the price
    res.status(200).json({
      success: true,
      averagePrice: averagePrice ? averagePrice.price : null,
      month: month,
      year: year,
      monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })
    });

  } catch (error) {
    console.error("Error fetching tea price average:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch average tea price"
    });
  }
});

// Configure Clerk middleware with proper options
const clerkMiddleware = ClerkExpressRequireAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
  authorizedParties: ['http://localhost:5173', 'http://localhost:5174'],
  headerName: 'Authorization',
  headerPrefix: 'Bearer',
  debug: true  // Add debug mode to see more detailed logs
});

// Add a custom middleware to handle possible Clerk errors
app.use('/api/*', (req, res, next) => {
  // Debug for incoming requests
  console.log('Incoming request:', req.method, req.path);
  console.log('Auth header:', req.headers.authorization);

  // Use actual authentication from Clerk
  try {
    clerkMiddleware(req, res, (err) => {
      if (err) {
        console.error('Clerk Auth Error:', err);
        return res.status(401).json({ error: 'Authentication failed', details: err.message });
      }
      next();
    });
  } catch (error) {
    console.error('Clerk middleware error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
});

// Use the user routes
app.use(userRoutes);

// Use the direct chat routes
app.use(directChatRoutes);

// Socket.io connection handling - to be implemented
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);
//
//   // Join a room based on user ID for private notifications
//   socket.on('join', (userId) => {
//     if (userId) {
//       socket.join(userId);
//       console.log(`User ${userId} joined their private room`);
//     }
//   });
//
//   // Handle chat message events
//   socket.on('new_message', (data) => {
//     // Notify the recipient
//     if (data.recipientId) {
//       io.to(data.recipientId).emit('message_notification', {
//         senderId: data.senderId,
//         senderName: data.senderName,
//         chatId: data.chatId,
//         messagePreview: data.messagePreview
//       });
//     }
//   });
//
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Get all chats for a user
app.get("/api/chats", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Get all chats for a user (for the sidebar)
app.get("/api/userchats", async (req, res) => {
  try {
    console.log('Auth object:', req.auth); // Add this line for debugging
    const userId = req.auth.userId;
    console.log('Fetching chats for userId:', userId); // Add this line for debugging

    // Make sure we're only fetching the chats for this specific user
    const userChats = await UserChats.findOne({ userId: userId });

    if (!userChats) {
      console.log('No chats found for userId:', userId); // Add this line for debugging
      return res.status(200).json([]);
    }

    console.log('Found chats:', userChats.chats); // Add this line for debugging
    res.status(200).json(userChats.chats);
  } catch (error) {
    console.error('Error in /api/userchats:', error);
    res.status(500).json({ error: "Failed to fetch user chats", details: error.message });
  }
});

// Add this new endpoint to get a single chat by ID
app.get("/api/chats/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});



// Also, we need to update the chat creation endpoint to add the chat to userChats
// Modify your existing chat creation endpoint
app.post("/api/chats", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { text } = req.body;

    const newChat = new Chat({
      userId: userId,
      title: text.substring(0, 30),
    });

    await newChat.save();

    const newMessage = new Message({
      chatId: newChat._id,
      text,
      role: "user",
    });

    await newMessage.save();

    // Add the chat to userChats
    let userChats = await UserChats.findOne({ userId: userId });

    if (!userChats) {
      userChats = new UserChats({
        userId: userId,
        chats: [],
      });
    }

    userChats.chats.push({
      _id: newChat._id.toString(),
      title: text.substring(0, 30),
      createdAt: new Date(),
    });

    await userChats.save();

    res.status(201).json(newChat._id);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Delete a chat
app.delete("/api/chats/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chatId = req.params.id;

    console.log('Delete request for chatId:', chatId, 'from userId:', userId);

    const chat = await Chat.findById(chatId);

    if (!chat) {
      console.log('Chat not found:', chatId);
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId !== userId) {
      console.log('Unauthorized delete attempt. Chat belongs to:', chat.userId);
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Chat.findByIdAndDelete(chatId);
    console.log('Chat deleted from Chat collection');

    await Message.deleteMany({ chatId });
    console.log('Messages deleted for chatId:', chatId);

    // Remove from userChats
    const result = await UserChats.updateOne(
      { userId: userId },
      { $pull: { chats: { _id: chatId } } }
    );

    console.log('UserChats update result:', result);

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error('Error in delete chat endpoint:', error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});



// Get all messages for a chat
app.get("/api/chats/:id/messages", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    // Format messages with proper structure
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      chatId: msg.chatId,
      text: msg.text,
      role: msg.role,
      images: msg.images || [],
      createdAt: msg.createdAt
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Update message creation endpoint
app.post("/api/chats/:id/messages", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const chatId = req.params.id;
    const { text, role, images } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newMessage = new Message({
      chatId,
      text,
      role,
      images: images || [],
      createdAt: new Date()
    });

    await newMessage.save();

    // Update chat's last activity
    chat.updatedAt = new Date();
    await chat.save();

    // Update userChats title if it's the first message
    if (role === "user") {
      const messagesCount = await Message.countDocuments({ chatId });
      if (messagesCount <= 2) {
        await UserChats.updateOne(
          { userId: userId, "chats._id": chatId },
          { $set: { "chats.$.title": text.substring(0, 30) } }
        );
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Add this new endpoint after your other routes
// Add this route if it doesn't exist
app.post("/api/users/role", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { role } = req.body;

    if (!role || !['farmer', 'factory', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Temporarily bypass Clerk API call for testing
    console.log(`Setting role for user ${userId} to ${role}`);

    // Return success without actually calling Clerk API
    return res.status(200).json({ message: "Role updated successfully" });

    /* Commented out for testing
    // Update the user's metadata in Clerk
    const updatedUser = await clerkClient.users.updateUser(userId, {
      unsafeMetadata: {
        role: role,
        updatedAt: new Date().toISOString()
      }
    });

    if (!updatedUser) {
      throw new Error("Failed to update user metadata");
    }

    res.status(200).json({ message: "Role updated successfully" });
    */
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// Get user's harvest data
app.get("/api/harvest-data", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const harvestData = await HarvestData.find({ userId });
    res.status(200).json(harvestData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch harvest data" });
  }
});

// Add new harvest data
app.post("/api/harvest-data", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { region, estateName, elevation, teaType, records } = req.body;

    // Check if user already has data for this estate
    let harvestData = await HarvestData.findOne({
      userId,
      estateName,
      region
    });

    if (harvestData) {
      // Add new records to existing data
      harvestData.records.push(...records);
      await harvestData.save();
    } else {
      // Create new harvest data entry
      harvestData = new HarvestData({
        userId,
        region,
        estateName,
        elevation,
        teaType,
        records
      });
      await harvestData.save();
    }

    res.status(201).json(harvestData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save harvest data" });
  }
});

// Get yield prediction
app.get("/api/yield-prediction/:region/:month", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { region, month } = req.params;

    // Get user's historical data for this region
    const harvestData = await HarvestData.find({
      userId,
      region
    });

    if (!harvestData.length) {
      return res.status(200).json({
        prediction: {
          current: "65%", // Default prediction
          trend: "stable",
          recommendation: "Insufficient historical data. Using regional averages."
        }
      });
    }

    // Calculate prediction based on historical data
    const prediction = calculateYieldPrediction(harvestData, parseInt(month));

    res.status(200).json({ prediction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate yield prediction" });
  }
});

// Helper function to calculate yield prediction
function calculateYieldPrediction(harvestData, targetMonth) {
  // Extract all records
  const allRecords = harvestData.flatMap(data => data.records);

  // Filter records for the target month
  const monthRecords = allRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === targetMonth;
  });

  if (monthRecords.length === 0) {
    return {
      current: "60%",
      trend: "stable",
      recommendation: "No historical data for this month. Using regional averages."
    };
  }

  // Calculate average yield for this month
  const avgYield = monthRecords.reduce((sum, record) => sum + record.yield, 0) / monthRecords.length;

  // Get records from previous month to determine trend
  const prevMonthRecords = allRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === (targetMonth === 0 ? 11 : targetMonth - 1);
  });

  let trend = "stable";
  let percentage = "75%";
  let recommendation = "Maintain regular harvesting schedule.";

  if (prevMonthRecords.length > 0) {
    const prevAvgYield = prevMonthRecords.reduce((sum, record) => sum + record.yield, 0) / prevMonthRecords.length;

    if (avgYield > prevAvgYield * 1.1) {
      trend = "increasing";
      percentage = "85%";
      recommendation = "Optimal harvesting time approaching. Schedule additional labor.";
    } else if (avgYield < prevAvgYield * 0.9) {
      trend = "decreasing";
      percentage = "65%";
      recommendation = "Yield may be lower than usual. Consider adjusting harvest schedule.";
    }
  }

  // Factor in weather conditions if available
  const recentRecords = monthRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  const hasWeatherData = recentRecords.some(r => r.rainfall !== undefined || r.temperature !== undefined);

  if (hasWeatherData) {
    const avgRainfall = recentRecords.filter(r => r.rainfall !== undefined)
      .reduce((sum, r) => sum + r.rainfall, 0) /
      recentRecords.filter(r => r.rainfall !== undefined).length;

    const avgTemp = recentRecords.filter(r => r.temperature !== undefined)
      .reduce((sum, r) => sum + r.temperature, 0) /
      recentRecords.filter(r => r.temperature !== undefined).length;

    // Adjust prediction based on weather
    if (avgRainfall > 200) {
      percentage = Math.max(parseInt(percentage) - 10, 50) + "%";
      recommendation = "High rainfall may affect harvest quality. Consider adjusting schedule.";
    } else if (avgTemp > 30) {
      percentage = Math.max(parseInt(percentage) - 5, 50) + "%";
      recommendation += " High temperatures may stress plants. Ensure adequate irrigation.";
    }
  }

  return {
    current: percentage,
    trend,
    recommendation
  };
}

// Factory endpoints

// Register a new factory
app.post("/api/factory/register", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { factoryName, mfNumber, address } = req.body;

    // Validate required fields
    if (!factoryName || !mfNumber || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already has a registered factory
    const existingFactory = await Factory.findOne({ userId });

    if (existingFactory) {
      // Update existing factory
      existingFactory.factoryName = factoryName;
      existingFactory.mfNumber = mfNumber;
      existingFactory.address = address;
      existingFactory.updatedAt = new Date();

      await existingFactory.save();
      return res.status(200).json(existingFactory);
    }

    // Create new factory
    const factory = new Factory({
      userId,
      factoryName,
      mfNumber,
      address
    });

    await factory.save();
    console.log(`Factory registered for user ${userId}: ${factoryName}`);

    res.status(201).json(factory);
  } catch (error) {
    console.error("Error registering factory:", error);
    res.status(500).json({ error: "Failed to register factory" });
  }
});

// Get factory profile
app.get("/api/factory/profile", async (req, res) => {
  try {
    const userId = req.auth.userId;

    const factory = await Factory.findOne({ userId });

    if (!factory) {
      return res.status(404).json({ error: "Factory not found" });
    }

    res.status(200).json(factory);
  } catch (error) {
    console.error("Error fetching factory profile:", error);
    res.status(500).json({ error: "Failed to fetch factory profile" });
  }
});

// Admin middleware - check if user has admin role
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // Check if user has admin role
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
};

// Set factory tea price - MODIFIED to check against average price
app.post("/api/factory/price", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { price, factoryName, date } = req.body;

    if (!price) {
      return res.status(400).json({ error: "Price is required" });
    }

    // Check if user has a registered factory
    const factory = await Factory.findOne({ userId });

    if (!factory) {
      return res.status(404).json({ error: "Factory not found" });
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Find average price record for current month/year
    const averagePrice = await AveragePrice.findOne({
      month: currentMonth,
      year: currentYear
    });

    // If average price is set, ensure the factory price is not lower
    if (averagePrice && parseFloat(price) < averagePrice.price) {
      return res.status(400).json({
        error: "Price below minimum average",
        minimumPrice: averagePrice.price,
        message: `Your price cannot be lower than the Tea Board's minimum average price of Rs. ${averagePrice.price} for this month.`
      });
    }

    // Create or update price record
    const priceRecord = await Price.findOneAndUpdate(
      { factoryId: userId },
      {
        factoryId: userId,
        factoryName: factoryName || factory.factoryName,
        price,
        date: date || new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json(priceRecord);
  } catch (error) {
    console.error("Error updating price:", error);
    res.status(500).json({ error: "Failed to update price" });
  }
});

// Get factory tea price (for individual factory)
app.get("/api/factory/price", async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Find the price for this factory
    const priceRecord = await Price.findOne({ factoryId: userId });

    if (!priceRecord) {
      return res.status(200).json({ price: "" });
    }

    res.status(200).json(priceRecord);
  } catch (error) {
    console.error("Error fetching price:", error);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

// Get all factories' prices (for farmers view)
app.get("/api/prices", async (req, res) => {
  try {
    // Find all price records
    const prices = await Price.find().sort({ date: -1 });

    res.status(200).json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// Create a new factory announcement
app.post("/api/factory/announcement", async (req, res) => {
  try {
    const userId = req.auth.userId;
    // First try to get the message as 'announcement' field
    const message = req.body.announcement || req.body.message;
    const { factoryName, factoryId, date, image } = req.body;

    console.log('Announcement data received:', JSON.stringify({
      ...req.body,
      image: req.body.image ? 'Image data received (truncated for logging)' : null
    }));

    if (!message) {
      return res.status(400).json({ error: "Announcement message is required" });
    }

    // Check if user has a registered factory
    const factory = await Factory.findOne({ userId });

    if (!factory) {
      return res.status(404).json({ error: "Factory not found" });
    }

    // Create new announcement record
    const newAnnouncement = new Announcement({
      factoryId: userId,
      factoryName: factoryName || factory.factoryName,
      message: message,
      image: image || null, // Store the image data URL directly
      date: date || new Date()
    });

    console.log('Creating announcement:', JSON.stringify({
      factoryId: userId,
      factoryName: factoryName || factory.factoryName,
      message: message,
      hasImage: !!image,
      date: date || new Date()
    }));

    try {
      await newAnnouncement.save();
      console.log('Announcement saved successfully with ID:', newAnnouncement._id);

      // Verify the announcement was saved by retrieving it
      const savedAnnouncement = await Announcement.findById(newAnnouncement._id);
      console.log('Retrieved saved announcement:', JSON.stringify({
        _id: savedAnnouncement._id,
        factoryId: savedAnnouncement.factoryId,
        factoryName: savedAnnouncement.factoryName,
        message: savedAnnouncement.message,
        hasImage: !!savedAnnouncement.image,
        date: savedAnnouncement.date
      }));

      res.status(201).json(newAnnouncement);
    } catch (saveError) {
      console.error("Error saving announcement:", saveError);
      return res.status(500).json({ error: "Failed to save announcement to database", details: saveError.message });
    }
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Failed to create announcement", details: error.message });
  }
});

// Update a factory announcement
app.put("/api/factory/announcement/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const announcementId = req.params.id;

    // First try to get the message as 'announcement' field
    const message = req.body.announcement || req.body.message;
    const { factoryName, image, date } = req.body;

    console.log('Announcement update data received:', JSON.stringify({
      id: announcementId,
      message: message ? message.substring(0, 30) + '...' : null,
      hasImage: !!image,
    }));

    if (!message) {
      return res.status(400).json({ error: "Announcement message is required" });
    }

    // Check if user has a registered factory
    const factory = await Factory.findOne({ userId });

    if (!factory) {
      return res.status(404).json({ error: "Factory not found" });
    }

    // Find the announcement and check if it belongs to this factory
    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    if (announcement.factoryId !== userId) {
      return res.status(403).json({ error: "You do not have permission to update this announcement" });
    }

    // Update the announcement
    announcement.message = message;
    announcement.factoryName = factoryName || factory.factoryName;

    // Only update image if provided
    if (image !== undefined) {
      announcement.image = image;
    }

    // Update date if provided, otherwise keep the original
    if (date) {
      announcement.date = date;
    }

    await announcement.save();
    console.log('Announcement updated successfully with ID:', announcement._id);

    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ error: "Failed to update announcement", details: error.message });
  }
});

// Delete a factory announcement
app.delete("/api/factory/announcement/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const announcementId = req.params.id;

    console.log('Delete request for announcement:', announcementId);

    // Check if announcement exists
    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    // Check if announcement belongs to this factory
    if (announcement.factoryId !== userId) {
      return res.status(403).json({ error: "You do not have permission to delete this announcement" });
    }

    // Delete the announcement
    await Announcement.findByIdAndDelete(announcementId);
    console.log('Announcement deleted successfully');

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement", details: error.message });
  }
});

// Get factory's announcements (for the factory owner)
app.get("/api/factory/announcements", async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('Fetching announcements for factory owner:', userId);

    // Find all announcements for this factory
    const announcements = await Announcement.find({
      factoryId: userId
    }).sort({ date: -1 });

    console.log(`Found ${announcements.length} announcements for factory owner`);

    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching factory announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Get all announcements (for farmers)
app.get("/api/announcements", async (req, res) => {
  try {
    console.log("Fetching all announcements for farmers");

    // Check the total count in the collection
    const totalCount = await Announcement.countDocuments();
    console.log(`Total announcements in database: ${totalCount}`);

    // Find all announcements from all factories
    const announcements = await Announcement.find()
      .sort({ date: -1 })
      .limit(20); // Limit to most recent 20 announcements

    console.log(`Found ${announcements.length} announcements for farmers`);
    if (announcements.length > 0) {
      // Log a sample announcement but trim image data to avoid console flooding
      const sampleAnnouncement = announcements[0];
      console.log('Sample announcement:', JSON.stringify({
        _id: sampleAnnouncement._id,
        factoryName: sampleAnnouncement.factoryName,
        message: sampleAnnouncement.message,
        hasImage: !!sampleAnnouncement.image,
        imageDataLength: sampleAnnouncement.image ? sampleAnnouncement.image.length : 0,
        date: sampleAnnouncement.date
      }));
    } else {
      console.log('No announcements found in the database');
    }

    // Format announcements to ensure consistent field names and validate image data
    const formattedAnnouncements = announcements.map(announcement => {
      // Validate image data - if it's not a proper data URL, set to null
      let imageData = announcement.image;
      if (imageData && !imageData.startsWith('data:image/')) {
        console.log(`Invalid image data found for announcement ${announcement._id}, resetting to null`);
        imageData = null;
      }

      return {
        factoryName: announcement.factoryName,
        message: announcement.message,
        date: announcement.date,
        image: imageData, // Use validated image data
        _id: announcement._id,
        factoryId: announcement.factoryId
      };
    });

    res.status(200).json(formattedAnnouncements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Submit a collection request (for farmers)
app.post("/api/collection-requests", async (req, res) => {
  try {
    const farmerId = req.auth.userId;
    const { factoryId, factoryName, quantity, date, note, farmerName, nicNumber, time, location } = req.body;

    console.log('Collection request data received:', req.body);

    if (!factoryId || !quantity || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create new collection request
    const newRequest = new CollectionRequest({
      factoryId,
      factoryName,
      farmerId,
      farmerName: farmerName || 'Farmer',
      nicNumber: nicNumber || 'N/A',
      quantity,
      date,
      time: time || '',
      note: note || '',
      location: location || {},
      status: 'pending'
    });

    console.log('Creating collection request:', newRequest);

    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating collection request:", error);
    res.status(500).json({ error: "Failed to create collection request" });
  }
});

// Get factory collection requests (for the factory owner)
app.get("/api/factory/requests", async (req, res) => {
  try {
    const factoryId = req.auth.userId;

    console.log(`Fetching collection requests for factory: ${factoryId}`);

    // Find all requests for this factory
    const requests = await CollectionRequest.find({
      factoryId: factoryId
    }).sort({ date: 1 }); // Sort by date, earliest first

    console.log(`Found ${requests.length} collection requests`);

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Update collection request status (for factories to accept/decline)
app.put("/api/factory/requests/:requestId", async (req, res) => {
  try {
    const factoryId = req.auth.userId;
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'approved', 'rejected', or 'completed'" });
    }

    // Find the request and make sure it belongs to this factory
    const request = await CollectionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.factoryId !== factoryId) {
      return res.status(403).json({ error: "Unauthorized. This request belongs to another factory" });
    }

    // Update the status
    request.status = status;
    await request.save();

    res.status(200).json(request);
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ error: "Failed to update request status" });
  }
});

// Get all factories (for farmers to select)
app.get("/api/factories", async (req, res) => {
  try {
    console.log("Fetching all factories for farmers - Request received - NO AUTH REQUIRED");

    // Skip authentication for this endpoint
    // Ensure at least one factory exists for testing
    const testFactory = {
      userId: "test-factory-id",
      factoryName: "Test Factory",
      mfNumber: "MF-TEST-123",
      address: "123 Test Street, Test City"
    };

    // Check if test factory exists
    const existingTestFactory = await Factory.findOne({ userId: "test-factory-id" });
    if (!existingTestFactory) {
      // Create test factory if it doesn't exist
      await Factory.create(testFactory);
      console.log("Created test factory for demo purposes");
    }

    // Find all factories
    console.log("Querying MongoDB for factories");
    const factories = await Factory.find({}, {
      userId: 1,
      factoryName: 1,
      mfNumber: 1,
      address: 1
    });

    console.log(`Found ${factories.length} factories in the database`);

    // If no factories found, return at least the test factory
    let formattedFactories = [];
    if (factories.length === 0) {
      formattedFactories = [{
        id: "test-factory-id",
        name: "Test Factory",
        mfNumber: "MF-TEST-123",
        address: "123 Test Street, Test City"
      }];
      console.log("No factories found, returning test factory");
    } else {
      // Format for frontend use
      formattedFactories = factories.map(factory => ({
        id: factory.userId,
        name: factory.factoryName,
        mfNumber: factory.mfNumber,
        address: factory.address
      }));
    }

    // Add some dummy factories regardless to ensure dropdown has options
    formattedFactories.push(
      { id: 'dummy1', name: 'Athukorala Tea Factory', mfNumber: 'MF123456', address: 'Kandy, Sri Lanka' },
      { id: 'dummy2', name: 'Nuwara Eliya Tea Factory', mfNumber: 'MF785412', address: 'Nuwara Eliya, Sri Lanka' },
      { id: 'dummy3', name: 'Dimbula Valley Tea', mfNumber: 'MF654987', address: 'Dimbula, Sri Lanka' }
    );

    console.log("Sending factories to client:", formattedFactories);
    res.status(200).json(formattedFactories);
  } catch (error) {
    console.error("Error fetching factories:", error);

    // Return dummy factories on error to ensure frontend has options
    const dummyFactories = [
      { id: 'dummy1', name: 'Athukorala Tea Factory', mfNumber: 'MF123456', address: 'Kandy, Sri Lanka' },
      { id: 'dummy2', name: 'Nuwara Eliya Tea Factory', mfNumber: 'MF785412', address: 'Nuwara Eliya, Sri Lanka' },
      { id: 'dummy3', name: 'Dimbula Valley Tea', mfNumber: 'MF654987', address: 'Dimbula, Sri Lanka' }
    ];

    console.log("Error occurred, returning dummy factories:", dummyFactories);
    res.status(200).json(dummyFactories);
  }
});

// Utility endpoint to create a test factory (FOR DEVELOPMENT USE ONLY)
app.post("/api/dev/create-test-factory", async (req, res) => {
  try {
    console.log("Creating test factory");

    // Create a test factory with a fixed ID for easy testing
    const testFactory = new Factory({
      userId: "test-factory-id",
      factoryName: "Test Factory",
      mfNumber: "MF-TEST-123",
      address: "123 Test Street, Test City",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Only create if it doesn't exist
    const existingFactory = await Factory.findOne({ userId: "test-factory-id" });
    if (existingFactory) {
      console.log("Test factory already exists");
      return res.status(200).json({
        message: "Test factory already exists",
        factory: existingFactory
      });
    }

    await testFactory.save();
    console.log("Test factory created successfully");

    res.status(201).json({
      message: "Test factory created successfully",
      factory: testFactory
    });
  } catch (error) {
    console.error("Error creating test factory:", error);
    res.status(500).json({ error: "Failed to create test factory" });
  }
});

// Farmer endpoints

// Register a new farmer
app.post("/api/farmer/register", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { farmerName, nicNumber, address } = req.body;

    // Validate required fields
    if (!farmerName || !nicNumber || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already has a registered farmer
    const existingFarmer = await Farmer.findOne({ userId });

    if (existingFarmer) {
      // Update existing farmer
      existingFarmer.farmerName = farmerName;
      existingFarmer.nicNumber = nicNumber;
      existingFarmer.address = address;
      existingFarmer.updatedAt = new Date();

      await existingFarmer.save();
      return res.status(200).json(existingFarmer);
    }

    // Create new farmer
    const farmer = new Farmer({
      userId,
      farmerName,
      nicNumber,
      address
    });

    await farmer.save();
    console.log(`Farmer registered for user ${userId}: ${farmerName}`);

    res.status(201).json(farmer);
  } catch (error) {
    console.error("Error registering farmer:", error);
    res.status(500).json({ error: "Failed to register farmer" });
  }
});

// Get farmer profile
app.get("/api/farmer/profile", async (req, res) => {
  try {
    const userId = req.auth.userId;

    const farmer = await Farmer.findOne({ userId });

    if (!farmer) {
      return res.status(404).json({ error: "Farmer not found" });
    }

    res.status(200).json(farmer);
  } catch (error) {
    console.error("Error fetching farmer profile:", error);
    res.status(500).json({ error: "Failed to fetch farmer profile" });
  }
});

// Get farmer's collection requests
app.get("/api/farmer/collection-requests", async (req, res) => {
  try {
    const farmerId = req.auth.userId;

    console.log(`Fetching collection requests for farmer: ${farmerId}`);

    // Find all requests for this farmer
    const requests = await CollectionRequest.find({
      farmerId: farmerId
    }).sort({ date: 1 }); // Sort by date, earliest first

    console.log(`Found ${requests.length} collection requests for farmer`);

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching farmer's requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Import required packages for file handling if not already imported
import multer from 'multer';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Define a schema for storing disease detections
const diseaseDetectionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['Farmer', 'Factory', 'Unknown']
  },
  imagePath: {
    type: String,
    required: true
  },
  result: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model for the disease detection schema
const DiseaseDetection = mongoose.model('DiseaseDetection', diseaseDetectionSchema);

// Register the model with the app
app.set('DiseaseDetection', DiseaseDetection);

// Import the tea disease routes
import teaDiseaseRoutes from './routes/teaDisease.js';

// Remove the intermediate middleware to avoid complications
// Configure middleware for the detect endpoint directly in the route file

// Add a test endpoint that doesn't use authentication
app.post('/api/test-tea-disease', upload.single('image'), (req, res) => {
  console.log('TEST ENDPOINT CALLED');
  console.log('File:', req.file);

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  // Run Python directly with full path to Python
  const pythonProcess = spawn('python', [
    path.join(__dirname, './ml/simple_test.py'),
    req.file.path
  ]);

  let result = '';
  let error = '';

  pythonProcess.stdout.on('data', (data) => {
    console.log('Python output:', data.toString());
    result += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('Python error:', data.toString());
    error += data.toString();
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);

    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: 'Error processing image',
        details: error
      });
    }

    try {
      // Find JSON in output
      const jsonStart = result.indexOf('{');
      const jsonEnd = result.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd <= 0) {
        return res.status(500).json({
          success: false,
          error: 'Invalid response format',
          raw: result
        });
      }

      const jsonStr = result.substring(jsonStart, jsonEnd);
      const prediction = JSON.parse(jsonStr);

      return res.status(200).json({
        success: true,
        result: prediction
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Error parsing result',
        details: err.message,
        raw: result
      });
    }
  });
});

// Use the tea disease routes
app.use('/api/tea-disease', teaDiseaseRoutes);

// Admin Routes - Set average tea price
app.post("/api/admin/set-average-price", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { price, month, year, notes } = req.body;

    console.log(`POST /api/admin/set-average-price - price: ${price}, month: ${month}, year: ${year}`);

    if (!price || price <= 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: "Valid month is required (1-12)" });
    }

    if (!year) {
      return res.status(400).json({ error: "Valid year is required" });
    }

    // Check if user has admin role
    const user = await clerkClient.users.getUser(userId);
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Convert price to a number to ensure it's stored properly
    const numericPrice = parseFloat(price);

    // Create or update average price record
    const averagePrice = await AveragePrice.findOneAndUpdate(
      { month, year },
      {
        price: numericPrice,
        month,
        year,
        setBy: userId,
        setAt: new Date(),
        notes: notes || ""
      },
      { upsert: true, new: true }
    );

    console.log(`Admin ${userId} set average price to ${numericPrice} for ${month}/${year}`);
    console.log("Saved average price data:", averagePrice);

    // Verify the saved record by retrieving it again
    const verifyRecord = await AveragePrice.findOne({ month, year });
    console.log("Verification - Retrieved record:", verifyRecord);

    // Return the updated record
    res.status(200).json(averagePrice);
  } catch (error) {
    console.error("Error setting average price:", error);
    res.status(500).json({ error: "Failed to set average price" });
  }
});

// Admin Routes - Get average tea price for a specific month/year
app.get("/api/admin/average-price", async (req, res) => {
  try {
    const { month, year } = req.query;

    // Validate inputs
    const validMonth = parseInt(month);
    const validYear = parseInt(year);

    if (isNaN(validMonth) || validMonth < 1 || validMonth > 12) {
      return res.status(400).json({ error: "Valid month is required (1-12)" });
    }

    if (isNaN(validYear)) {
      return res.status(400).json({ error: "Valid year is required" });
    }

    // Find average price record
    const averagePrice = await AveragePrice.findOne({
      month: validMonth,
      year: validYear
    });

    // Return consistent response format with clear price value
    if (!averagePrice) {
      return res.status(200).json({
        price: null,
        month: validMonth,
        year: validYear,
        message: "No average price set for this period"
      });
    }

    res.status(200).json(averagePrice);
  } catch (error) {
    console.error("Error fetching average price:", error);
    res.status(500).json({ error: "Failed to fetch average price" });
  }
});

// Admin Routes - Get tea price history for a year
app.get("/api/admin/price-history", async (req, res) => {
  try {
    const { year } = req.query;
    const userId = req.auth.userId;

    // Validate input
    const validYear = parseInt(year);

    if (isNaN(validYear)) {
      return res.status(400).json({ error: "Valid year is required" });
    }

    // Check if user is admin
    const user = await clerkClient.users.getUser(userId);
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Prepare data for all months
    const priceHistory = [];

    // Get all average prices for this year
    const averagePrices = await AveragePrice.find({ year: validYear });

    // For each month (1-12)
    for (let month = 1; month <= 12; month++) {
      // Find the average price record for this month
      const averagePrice = averagePrices.find(p => p.month === month);

      // Get factory prices for this month range
      const monthStart = new Date(validYear, month - 1, 1);
      const monthEnd = new Date(validYear, month, 0);

      // Query factory prices within this month
      const factoryPrices = await Price.find({
        date: { $gte: monthStart, $lte: monthEnd }
      });

      // Calculate min and max prices if there are any factory prices
      let lowestPrice = null;
      let highestPrice = null;

      if (factoryPrices.length > 0) {
        // Convert string prices to numbers for comparison
        const numericPrices = factoryPrices.map(p => parseFloat(p.price));
        lowestPrice = Math.min(...numericPrices);
        highestPrice = Math.max(...numericPrices);
      }

      // Add data for this month
      priceHistory.push({
        month,
        averagePrice: averagePrice ? averagePrice.price : null,
        lowestPrice,
        highestPrice,
        factoryCount: factoryPrices.length
      });
    }

    res.status(200).json(priceHistory);
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// Add a test endpoint to verify AveragePrice model is working
app.get("/api/debug/average-price", async (req, res) => {
  try {
    console.log("DEBUG endpoint for average price called");

    // Get all average price records
    const allPrices = await AveragePrice.find({});
    console.log("All average prices in database:", allPrices);

    // Create a test record
    const now = new Date();
    const testPrice = {
      price: 999,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      setBy: "test-user-id",
      setAt: now,
      notes: "Test record from debug endpoint"
    };

    // Save the test record
    const testRecord = new AveragePrice(testPrice);
    await testRecord.save();
    console.log("Test record saved:", testRecord);

    // Find the test record
    const foundRecord = await AveragePrice.findById(testRecord._id);
    console.log("Found test record:", foundRecord);

    return res.status(200).json({
      allRecords: allPrices,
      testRecord: foundRecord,
      message: "Check server logs for details"
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin Routes - Get tea price averages for all months
app.get("/api/admin/tea-prices/averages", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { year } = req.query;

    // Validate year parameter
    const validYear = parseInt(year) || new Date().getFullYear();

    // Check if user has admin role
    const user = await clerkClient.users.getUser(userId);
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Get all average prices for the requested year
    const averagePrices = await AveragePrice.find({ year: validYear });

    // Format the data for the frontend
    const formattedPrices = [];

    // For each month (1-12)
    for (let month = 1; month <= 12; month++) {
      // Find the price for this month
      const monthPrice = averagePrices.find(p => p.month === month);

      formattedPrices.push({
        month,
        monthName: new Date(validYear, month - 1, 1).toLocaleString('default', { month: 'long' }),
        price: monthPrice ? monthPrice.price : null,
        setBy: monthPrice ? monthPrice.setBy : null,
        setAt: monthPrice ? monthPrice.setAt : null
      });
    }

    res.status(200).json({
      year: validYear,
      prices: formattedPrices
    });
  } catch (error) {
    console.error("Error fetching tea price averages:", error);
    res.status(500).json({ error: "Failed to fetch tea price averages" });
  }
});

// Admin route - Get statistics about tea prices
app.get("/api/admin/tea-prices/statistics", async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Check if user has admin role
    const user = await clerkClient.users.getUser(userId);
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Calculate stats for the current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get the average price set by admin for current month
    const adminPrice = await AveragePrice.findOne({
      month: currentMonth,
      year: currentYear
    });

    // Get all factory prices
    const factoryPrices = await Price.find({
      date: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      }
    });

    // Calculate statistics
    let stats = {
      adminAveragePrice: adminPrice ? adminPrice.price : null,
      factoryCount: factoryPrices.length,
      averageFactoryPrice: 0,
      lowestPrice: null,
      highestPrice: null,
      totalTransactions: 0,
      belowAverageCount: 0
    };

    if (factoryPrices.length > 0) {
      // Convert price strings to numbers
      const prices = factoryPrices.map(p => parseFloat(p.price));

      stats.averageFactoryPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
      stats.lowestPrice = Math.min(...prices).toFixed(2);
      stats.highestPrice = Math.max(...prices).toFixed(2);

      // Count factories below admin average
      if (adminPrice) {
        stats.belowAverageCount = prices.filter(p => p < adminPrice.price).length;
      }
    }

    // Get total collection transactions for this month
    const transactionCount = await CollectionRequest.countDocuments({
      date: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1)
      },
      status: 'completed'
    });

    stats.totalTransactions = transactionCount;

    res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' }),
      statistics: stats
    });
  } catch (error) {
    console.error("Error fetching tea price statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tea price statistics"
    });
  }
});

// Admin route - Calculate average factory prices by month
app.get("/api/admin/tea-prices/factory-averages", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { year, month } = req.query;

    // Validate parameters
    const validYear = parseInt(year) || new Date().getFullYear();
    const validMonth = parseInt(month) || new Date().getMonth() + 1;

    // Check if user has admin role
    const user = await clerkClient.users.getUser(userId);
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Define the date range for the requested month
    const startDate = new Date(validYear, validMonth - 1, 1);
    const endDate = new Date(validYear, validMonth, 0); // Last day of the month

    // Find all prices set by factories in this month
    const prices = await Price.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    // Group by factory and calculate average if multiple prices per factory
    const factoryPrices = {};
    prices.forEach(price => {
      if (!factoryPrices[price.factoryId]) {
        factoryPrices[price.factoryId] = {
          factoryId: price.factoryId,
          factoryName: price.factoryName,
          prices: [],
          averagePrice: 0,
          latestPrice: parseFloat(price.price),
          latestDate: price.date
        };
      }
      factoryPrices[price.factoryId].prices.push(parseFloat(price.price));
    });

    // Calculate averages for each factory
    Object.values(factoryPrices).forEach(factory => {
      factory.averagePrice = (factory.prices.reduce((a, b) => a + b, 0) / factory.prices.length).toFixed(2);
    });

    // Get the admin average price for comparison
    const adminPrice = await AveragePrice.findOne({
      month: validMonth,
      year: validYear
    });

    res.status(200).json({
      success: true,
      month: validMonth,
      year: validYear,
      monthName: startDate.toLocaleString('default', { month: 'long' }),
      adminAveragePrice: adminPrice ? adminPrice.price : null,
      factories: Object.values(factoryPrices)
    });
  } catch (error) {
    console.error("Error calculating factory average prices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate factory average prices"
    });
  }
});

// Admin route - Get compliance report (factories below minimum price)
app.get("/api/admin/tea-prices/compliance", async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Check if user has admin role
    const user = await clerkClient.users.getUser(userId);
    const isUserAdmin = user.unsafeMetadata && user.unsafeMetadata.role === 'admin';

    if (!isUserAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get the admin average price
    const adminPrice = await AveragePrice.findOne({
      month: currentMonth,
      year: currentYear
    });

    if (!adminPrice) {
      return res.status(200).json({
        success: true,
        message: "No average price set for current month",
        nonCompliantFactories: []
      });
    }

    // Find the latest price for each factory
    const allFactories = await Factory.find({});
    const factoryPrices = await Price.find().sort({ date: -1 });

    // Group by factory to get latest price
    const latestPrices = {};
    factoryPrices.forEach(price => {
      if (!latestPrices[price.factoryId]) {
        latestPrices[price.factoryId] = {
          factoryId: price.factoryId,
          factoryName: price.factoryName,
          price: parseFloat(price.price),
          date: price.date
        };
      }
    });

    // Find non-compliant factories (below minimum price or no price set)
    const nonCompliantFactories = [];

    allFactories.forEach(factory => {
      const factoryPrice = latestPrices[factory.factoryId];

      if (!factoryPrice) {
        // Factory has no price set
        nonCompliantFactories.push({
          factoryId: factory.factoryId,
          factoryName: factory.name,
          status: "No price set",
          currentPrice: null,
          requiredPrice: adminPrice.price,
          lastUpdated: null
        });
      } else if (factoryPrice.price < adminPrice.price) {
        // Factory price is below minimum
        nonCompliantFactories.push({
          factoryId: factory.factoryId,
          factoryName: factoryPrice.factoryName,
          status: "Below minimum",
          currentPrice: factoryPrice.price,
          requiredPrice: adminPrice.price,
          difference: (adminPrice.price - factoryPrice.price).toFixed(2),
          lastUpdated: factoryPrice.date
        });
      }
    });

    res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      monthName: new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' }),
      minimumPrice: adminPrice.price,
      totalFactories: allFactories.length,
      nonCompliantCount: nonCompliantFactories.length,
      nonCompliantFactories
    });
  } catch (error) {
    console.error("Error generating compliance report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate compliance report"
    });
  }
});

// Direct messaging routes are now imported from directChatRoutes.js

// Start the server
// Use app.listen for now, will switch to server.listen when Socket.io is implemented
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});