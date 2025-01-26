// import axios from 'axios';

// const GEMINI_API_URL = process.env.GEMINI_API_URL;
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// export const generateResponse = async (prompt) => {
//   const headers = {
//     'Content-Type': 'application/json',
//     'x-goog-api-key': GEMINI_API_KEY,
//   };

//   const data = {
//     contents: [{ role: 'user', parts: [{ text: prompt }] }],
//   };

//   for (let attempt = 0; attempt < 3; attempt++) {
//     try {
//       const response = await axios.post(GEMINI_API_URL, data, { headers });
//       if (response.status === 200 && response.data.candidates) {
//         return response.data.candidates[0].content.parts[0].text;
//       } else if (response.status === 429 || response.status === 503) {
//         const backoffTime = Math.pow(2, attempt) * 100 + Math.random() * 1000;
//         await new Promise((r) => setTimeout(r, backoffTime));
//       } else {
//         throw new Error('Invalid API response');
//       }
//     } catch (err) {
//       console.error('Error generating response:', err);
//     }
//   }

//   return 'Service is currently unavailable. Please try again later.';
// };
