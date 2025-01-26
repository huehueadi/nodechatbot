import Chat from '../models/chatModel.js';
import ScrapedData from '../models/scrappedDataModel.js';
import { generateResponse } from '../services/aiService.js';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3({
  accessKeyId: 'AKIAVA5YKWJQASXNWYFI',
  secretAccessKey: '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',
  region: 'ap-south-1'
});

export const handleChat = async (req, res) => {
  const { message, uuid } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!uuid) {
    return res.status(400).json({ error: 'UUID for the scraped data is required' });
  }

  try {
    const scrapedDataRecord = await ScrapedData.findOne({ uuid });
    if (!scrapedDataRecord) {
      return res.status(404).json({ error: 'Scraped data not found for the provided UUID' });
    }

    const s3Data = await fetchDataFromS3(scrapedDataRecord.s3Url);
    
    const formattedPrompt = formatScrapedDataForAI(s3Data);

    const botResponse = await generateResponse(formattedPrompt);

    const chatLog = new Chat({
      user_message: message,
      bot_response: botResponse,
      scrapedData: scrapedDataRecord.uuid,  
    });
    await chatLog.save();

    res.json({ response: botResponse });
  } catch (err) {
    console.error('Error handling chat:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to fetch data from S3 and filter the valid data (paragraphs and links)
const fetchDataFromS3 = async (s3Url) => {
  try {
    const response = await axios.get(s3Url);
    const scrapedData = response.data;

    // If the data is raw text (not JSON), handle it accordingly
    if (typeof scrapedData === 'string') {
      // If raw text, you can split into paragraphs (or any other way)
      return scrapedData.split("\n").filter(paragraph => paragraph.trim() !== "");
    }

    // If it's JSON and contains 'paragraphs' and 'links'
    if (Array.isArray(scrapedData)) {
      let filteredData = [];

      // Loop through the data and filter valid paragraphs and links
      scrapedData.forEach((item) => {
        if (item.paragraphs && Array.isArray(item.paragraphs)) {
          const validParagraphs = item.paragraphs.filter(paragraph => paragraph.trim() !== "" && paragraph !== "Test Mode");
          filteredData.push(...validParagraphs);
        }

        if (item.links && Array.isArray(item.links)) {
          const validLinks = item.links.filter(link => typeof link === 'string' && link.includes("http"));
          filteredData.push(...validLinks);
        }
      });

      return filteredData;
    }

    // Return empty array if data format is unexpected
    return [];
  } catch (error) {
    console.error('Error fetching data from S3:', error);
    throw new Error('Failed to fetch data from S3');
  }
};

// Function to format the scraped data for AI
const formatScrapedDataForAI = (scrapedData, userQuery) => {
  // Join the scraped data as paragraphs or text chunks (assuming it's an array of text)
  const formattedText = scrapedData.join("\n\n");

  console.log("Formatted Text for AI:", formattedText);  // Debugging line to check

  // Create the prompt with both the scraped data and the user's query
  return `Here is some scraped data:\n\n${formattedText}\n\nUser's question: ${userQuery}\nResponse:`;
};
