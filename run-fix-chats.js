// Direct database migration script to fix chat names
// This can be run directly without requiring the API server
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// MongoDB models
let DirectChat, Farmer, Factory;

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function connectToDatabase() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ceylonara', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Import models
    const directChatSchema = new mongoose.Schema({
      participants: [{
        userId: String,
        role: String,
        name: String
      }],
      messages: [{
        sender: String,
        text: String,
        timestamp: Date,
        read: Boolean
      }],
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    });
    
    const farmerSchema = new mongoose.Schema({
      userId: String,
      farmerName: String,
      address: String,
      contactNumber: String,
      email: String,
      landDetails: Array,
      harvests: Array
    });
    
    const factorySchema = new mongoose.Schema({
      userId: String,
      factoryName: String,
      address: String,
      contactNumber: String,
      email: String,
      businessRegistrationNumber: String
    });

    DirectChat = mongoose.model('DirectChat', directChatSchema);
    Farmer = mongoose.model('Farmer', farmerSchema);
    Factory = mongoose.model('Factory', factorySchema);
    
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
}

async function fixChatNames() {
  try {
    console.log("Running fix-chat-names migration directly");
    const chats = await DirectChat.find({});
    console.log(`Found ${chats.length} chats to process`);
    
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

    console.log('------------------------------------');
    console.log(`Migration complete! Updated ${updatedCount} of ${chats.length} chats`);
    if (errors.length > 0) {
      console.log(`Encountered ${errors.length} errors:`);
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error('Error fixing chat names:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Main execution
console.log('===== Chat Names Fix Migration Tool =====');

rl.question('Run this migration to fix all chat names in the database (y/N)? ', async (answer) => {
  if (answer.toLowerCase() === 'y') {
    const connected = await connectToDatabase();
    if (connected) {
      await fixChatNames();
    }
  } else {
    console.log('Migration cancelled');
  }
  rl.close();
}); 