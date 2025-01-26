import express, { Router } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './src/routes/chatRoutes.js';
import connectDB from './src/config/db.js';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
connectDB()
// Routes
app.use('/v1', router);

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
