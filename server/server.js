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

const MAX_CACHE_SIZE = 10000; // Adjust the cache size as needed
let isAIModelReady = false; // Flag to check if the AI model is ready
const responseCache = new Map();
const WARM_UP_PROMPT = 'Warm-up prompt';

// Pre-warm the AI Model during server startup
initializeAIModel();

async function initializeAIModel() {
  try {
    console.log('Initializing AI model...');
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: WARM_UP_PROMPT,
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    responseCache.set(WARM_UP_PROMPT, botResponse);

    console.log('AI model is ready!');
    isAIModelReady = true;

    // Start the server after the AI model is initialized
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
  } catch (error) {
    console.error('Error initializing AI model:', error);
    process.exit(1); // Exit the server if there's an error during initialization
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

// Middleware to handle cache lookup
app.use((req, res, next) => {
  const { prompt } = req.body;
  if (responseCache.has(prompt)) {
    console.log('Cache hit for prompt:', prompt);
    return res.status(200).send({ bot: responseCache.get(prompt) });
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

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Sanitize and escape the input prompt to prevent XSS attacks
    prompt = sanitizeInput(prompt);

    // Check if the response is cached
    if (responseCache.has(prompt)) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache.get(prompt) });
    }

    // Set a timeout for generating the response to avoid long waiting times
    const timeoutMs = 5000; // Adjust this value as needed
    const responsePromise = openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0.7,
      max_tokens: 200,
      top_p: 0.7,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('AI model response timeout'));
      }, timeoutMs);
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';

    // Add the response to the cache
    if (responseCache.size >= MAX_CACHE_SIZE) {
      const oldestPrompt = responseCache.keys().next().value;
      responseCache.delete(oldestPrompt);
    }
    responseCache.set(prompt, botResponse);

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
