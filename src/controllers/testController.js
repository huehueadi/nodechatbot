// import { generateResponse } from '../services/aiService.js';  // Import your AI service

// export const handleUserInput = async (req, res) => {
//   const { message } = req.body;  // Extract message and UUID from the request body

//   if (!message) {
//     return res.status(400).json({ error: 'Message is required' });
//   }

//   try {


//     const aiResponse = await generateResponse(message);

//     res.json({ response: aiResponse });
//   } catch (err) {
//     console.error('Error in handleUserInput controller:', err.message);
//     res.status(500).json({ error: 'Internal server error, unable to generate response' });
//   }
// };










import { generateResponse } from '../services/aiService.js';  // Import your AI service
import ScrapedData from '../models/scrappedDataModel.js';  // Import your ScrapedData model
import AWS from 'aws-sdk';  // AWS SDK for accessing S3
import axios from 'axios';

// Initialize the AWS S3 client
const s3 = new AWS.S3({
  accessKeyId: 'AKIAVA5YKWJQASXNWYFI',
  secretAccessKey: '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',
  region: 'ap-south-1'
});


// Function to fetch data from S3
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

export const handleUserInput = async (req, res) => {
  const { message, uuid } = req.body;  // Extract message and UUID from the request body

  // Validate input
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!uuid) {
    return res.status(400).json({ error: 'UUID is required' });
  }

  try {
    // 1. Fetch scraped data using UUID from the database
    const scrapedDataRecord = await ScrapedData.findOne({ uuid });

    if (!scrapedDataRecord) {
      return res.status(404).json({ error: 'Scraped data not found for the provided UUID' });
    }

    // 2. Fetch S3 data using the S3 URL stored in the scraped data record
    const s3Data = await fetchDataFromS3(scrapedDataRecord.s3Url);

    // 3. Format the prompt combining S3 data and user message
    const formattedPrompt = formatPromptForAI(s3Data, message);

    // 4. Get AI response from Gemini
    const aiResponse = await generateResponse(formattedPrompt);

    // 5. Return the AI response to the user
    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Error in handleUserInput controller:', err.message);
    res.status(500).json({ error: 'Internal server error, unable to generate response' });
  }
};

const formatPromptForAI = (s3Data, userQuery) => {
  return `Here is some data from the file nUser's question: ${userQuery}\nResponse:`;
};
