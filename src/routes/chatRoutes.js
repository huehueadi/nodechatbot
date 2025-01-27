import express from 'express';
import { handleChat } from '../controllers/chatController.js';
import { scrapeWebsiteController } from '../controllers/scrapingController.js';
import { handleUserInput } from '../controllers/testController.js';
// import {  handleChatt } from '../controllers/testController.js';

const router = express.Router();

router.post('/chat', handleChat);
router.post('/scrape', scrapeWebsiteController);
router.post('/t1/chat', handleUserInput);


export default router;