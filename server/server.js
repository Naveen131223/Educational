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
    const warmUpPrompts = [
      { prompt: 'Warm-up prompt 1' },
      { prompt: 'Warm-up prompt 2' },
      // Add more warm-up prompts here as needed
    ];

    const responses = await Promise.all(
      warmUpPrompts.map((prompt) =>
        openai.createCompletion({
          model: process.env.OPENAI_MODEL || 'text-davinci-003',
          prompt: prompt.prompt,
          temperature: 0,
          max_tokens: 3000,
          top_p: 1,
          frequency_penalty: 0.5,
          presence_penalty: 0,
        })
      )
    );

    for (let i = 0; i < responses.length; i++) {
      const botResponse = responses[i].data.choices[0]?.text || 'No response from the AI model.';
      responseCache[warmUpPrompts[i].prompt] = botResponse;
    }

    console.log('AI model is ready!');
    isAIModelReady = true;
  } catch (error) {
    console.error('Error initializing AI model:', error);
  }
}

// Warm-up the AI model when starting the server
initializeAIModelAndCacheResponse();

// Function to send a dummy message to the AI model
async function sendDummyMessage() {
  try {
    console.log('Sending dummy message...');
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: 'Hi Sister',
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    console.log('Dummy message response:', botResponse);
  } catch (error) {
    console.error('Error sending dummy message:', error);
  }
}

// Schedule the function to run every 10 minutes (600,000 milliseconds)
setInterval(sendDummyMessage, 600000);

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
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Sanitize and escape the input prompt to prevent XSS attacks
    prompt = sanitizeInput(prompt);

    // Check if the response is cached
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // Send the request to the AI model asynchronously
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    responseCache[prompt] = botResponse;

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong');
});

// Start the server
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
