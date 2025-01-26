import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true },
    userMessage: { type: String, required: true },
    botResponse: { type: String, required: true },
    sentiment: { type: String, default: 'Neutral' },
    responseTime: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'analytics' }
);

export default mongoose.model('Analytics', analyticsSchema);
