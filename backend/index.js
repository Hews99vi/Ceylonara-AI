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

dotenv.config();

const app = express();
const PORT = 3002;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
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
  
  // Temporarily bypass authentication for testing
  req.auth = { userId: "user_2VA4gMpwxAK2iLAyB2FQSp04YAf" }; // Use a fake user ID
  return next();
  
  // Commented out for testing
  /*
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
  */
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
    const userChats = await UserChats.findOne({ userId });
    
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
      userId,
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
    let userChats = await UserChats.findOne({ userId });
    
    if (!userChats) {
      userChats = new UserChats({
        userId,
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

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chatId });
    
    // Remove from userChats
    await UserChats.updateOne(
      { userId },
      { $pull: { chats: { _id: chatId } } }
    );

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error(error);
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
          { userId, "chats._id": chatId },
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});