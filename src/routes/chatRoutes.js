import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { scrapeWebsiteController } from '../controllers/scrapingController.js';

const router = express.Router();

// Route to handle chat
router.post('/chat', handleChat);
router.post('/scrape', scrapeWebsiteController);


export default router;