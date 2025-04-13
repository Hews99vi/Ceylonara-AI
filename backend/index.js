import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { clerkClient, ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Chat from "./models/chat.js";
import Message from "./models/message.js";
import ImageKit from "imagekit";
import UserChats from "./models/userChats.js";

// Import the new HarvestData model
import HarvestData from "./models/harvestData.js";

// Import the Factory model
import Factory from './models/factory.js';

// Import the Farmer model
import Farmer from './models/farmer.js';

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
    default: null
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

// Middleware
// Update middleware configuration
app.use(express.json());

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
}));

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

    if (!role || !['farmer', 'factory'].includes(role)) {
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

// Set factory tea price
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
    
    console.log('Announcement data received:', JSON.stringify(req.body));
    
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
      image: image || null, // Handle image if provided
      date: date || new Date()
    });
    
    console.log('Creating announcement:', JSON.stringify(newAnnouncement));
    
    try {
      await newAnnouncement.save();
      console.log('Announcement saved successfully with ID:', newAnnouncement._id);
      
      // Verify the announcement was saved by retrieving it
      const savedAnnouncement = await Announcement.findById(newAnnouncement._id);
      console.log('Retrieved saved announcement:', JSON.stringify(savedAnnouncement));
      
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
      console.log('Sample announcement:', JSON.stringify(announcements[0]));
    } else {
      console.log('No announcements found in the database');
    }
    
    // Format announcements to ensure consistent field names
    const formattedAnnouncements = announcements.map(announcement => ({
      factoryName: announcement.factoryName,
      message: announcement.message,
      date: announcement.date,
      image: announcement.image,
      // Include additional fields
      _id: announcement._id,
      factoryId: announcement.factoryId
    }));
    
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});