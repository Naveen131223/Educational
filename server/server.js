import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Please provide an OPENAI_API_KEY in your environment variables.');
  process.exit(1);
}

const configuration = new Configuration({
  apiKey,
});

const openai = new OpenAIApi(configuration);

// Simple in-memory cache to store AI responses
const responseCache = {};

async function preloadModel() {
  try {
    const prompt = 'Preloading AI model...';
    const aiResponse = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 1,
    });

    console.log('AI model preloaded successfully!');
  } catch (error) {
    console.error('Failed to preload AI model:', error);
  }
}

preloadModel();

// Function to send the dummy message
function sendDummyMessage() {
  fetch('http://your-ai-model-endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: 'Hi Sister' }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('AI Response:', data);
    })
    .catch((error) => console.error('Error sending dummy message:', error));
}

// Call the function to start the loop
function startDummyMessageLoop() {
  // Send the dummy message immediately when the loop starts
  sendDummyMessage();

  // Repeat the dummy message every 10 minutes
  const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds
  setInterval(sendDummyMessage, TEN_MINUTES);
}

// Call the function to start the loop
startDummyMessageLoop();

app.post('/', async (req, res) => {
  // ... (existing code for handling AI model requests)
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong');
});

// Start the server and handle graceful shutdown
const server = app.listen(port, () => {
  console.log(`AI server started on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
