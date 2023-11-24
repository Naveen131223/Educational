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
const WARM_UP_PROMPT = 'Warm-up prompt';

// Initialize the AI model asynchronously during server startup
const modelInitializationPromise = initializeAIModel();

async function initializeAIModel() {
  try {
    console.log('Initializing AI model...');
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-002',
      prompt: WARM_UP_PROMPT,
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    responseCache[WARM_UP_PROMPT] = botResponse;

    console.log('AI model is ready!');
    isAIModelReady = true;
  } catch (error) {
    console.error('Error initializing AI model:', error);
  }
}

// Middleware to check if the AI model is ready before processing requests
app.use((req, res, next) => {
  if (!isAIModelReady) {
    return res.status(200).send({
      message: 'Initializing AI model, please wait...',
    });
  }
  next();
});

app.get('/status', (req, res) => {
  if (isAIModelReady) {
    return res.status(200).send({
      status: 'AI model is ready!',
    });
  }
  res.status(200).send({
    status: 'AI model is initializing...',
  });
});

app.get('/', (req, res) => {
  // If the AI model is ready, return the cached warm-up response immediately
  return res.status(200).send({
    bot: responseCache[WARM_UP_PROMPT],
  });
});

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Sanitize and escape the input prompt to prevent XSS attacks
    prompt = sanitizeInput(prompt);

    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0.2,
      max_tokens: 500,
      top_p: 0.5,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
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

// Start the server after the AI model is initialized
modelInitializationPromise.then(() => {
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
});

function sanitizeInput(input) {
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
