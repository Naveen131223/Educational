import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Please provide an OPENAI_API_KEY in your environment variables.');
  process.exit(1);
}

const configuration = new Configuration({
  apiKey,
});

const openai = new OpenAIApi(configuration);

// Simple in-memory cache to store API responses
const responseCache = {};
let isAIModelReady = false; // Flag to check if the AI model is ready

// Initialize the AI model and cache the first response
async function initializeAIModelAndCacheResponse() {
  try {
    console.log('Initializing AI model...');
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: 'Warm-up prompt',
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    responseCache['warm-up-prompt'] = botResponse;

    console.log('AI model is ready!');
    isAIModelReady = true;

    // Start the server after the AI model is ready
    const server = app.listen(port, () => {
      console.log(`AI server started on http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server has been closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error initializing AI model:', error);
  }
}

// Warm-up the AI model when starting the server
initializeAIModelAndCacheResponse();

app.get('/', (req, res) => {
  if (isAIModelReady) {
    res.status(200).send({
      message: 'Hi Sister',
    });
  } else {
    res.status(200).send({
      message: 'Initializing AI model, please wait...',
    });
  }
});

app.post('/', async (req, res) => {
  // The rest of the code remains the same as before
  // ...
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong');
});

function sanitizeInput(input) {
  // Function to sanitize and escape input to prevent XSS attacks
  // Replace any potentially dangerous characters with their HTML entity representation
  return input.replace(/[&<>"'\/]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      case '/':
        return '&#x2F;';
      default:
        return char;
    }
  });
}
