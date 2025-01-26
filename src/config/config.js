const config = {
    bucketName: 'your-google-cloud-bucket-name',
    serviceAccountFile: 'path-to-service-account-file.json',
    geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    geminiApiKey: 'your-gemini-api-key',
    mongoUri: 'mongodb://localhost:27017/chatbot' // Local MongoDB URI
  };
  
  module.exports = config;
  