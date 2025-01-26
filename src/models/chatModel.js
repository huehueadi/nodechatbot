import mongoose from 'mongoose';

// Define the schema for storing chat data
const chatSchema = new mongoose.Schema({
  user_message: {
    type: String,
    required: true
  },
  bot_response: {
    type: String,
    required: true
  },
  scrapedData: {
    type: mongoose.Schema.Types.String, // This will store the UUID of ScrapedData
    ref: 'ScrapedData',
    required: true
  },
  timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
