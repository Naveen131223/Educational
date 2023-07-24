import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(compression());

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
const responseCache = new Map();
const MAX_CACHE_SIZE = 1000; // Limit the number of cached responses

let isAIModelReady = false; // Flag to check if the AI model is ready
const WARM_UP_PROMPT = 'Warm-up prompt';

// Initialize the AI model asynchronously during server startup
const modelInitializationPromise = initializeAIModel();

async function initializeAIModel() {
  try {
    console.log('Initializing AI model...');
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: WARM_UP_PROMPT,
      max_tokens: 1, // Only requesting one token to reduce unnecessary response data
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    if (botResponse.toLowerCase() === 'ok') {
      // Check if the AI model's response is satisfactory for warm-up prompt
      console.log('AI model is ready!');
      isAIModelReady = true;
    } else {
      console.error('AI model warm-up response is not satisfactory:', botResponse);
    }
  } catch (error) {
    console.error('Error initializing AI model:', error);
    // You may want to retry the initialization in case of failure
  }
}

app.use((req, res, next) => {
  // If the AI model is not ready and the request is not for the initial warm-up prompt,
  // send a message indicating that the AI model is initializing.
  if (!isAIModelReady && req.body.prompt !== WARM_UP_PROMPT) {
    res.status(200).send({
      message: 'Initializing AI model, please wait...',
    });
  } else {
    next();
  }
});

// Endpoint to provide information on the AI model's initialization status
app.get('/status', (req, res) => {
  if (isAIModelReady) {
    res.status(200).send({
      status: 'AI model is ready!',
    });
  } else {
    res.status(200).send({
      status: 'AI model is initializing...',
    });
  }
});

app.get('/', (req, res) => {
  if (isAIModelReady) {
    // If the AI model is ready, return the cached warm-up response immediately
    res.status(200).send({
      bot: responseCache.get(WARM_UP_PROMPT),
    });
  } else {
    // If the AI model is still initializing, send a message indicating the same
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
    if (responseCache.has(prompt)) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache.get(prompt) });
    }

    // Send the request to the AI model asynchronously
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0.7, // Higher temperature can make the output more diverse
      max_tokens: 200, // Limit the response length to 200 tokens for faster output
      top_p: 0.8, // Adjust the top-p parameter to control the response randomness
      frequency_penalty: 0.2,
      presence_penalty: 0.2,
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    responseCache.set(prompt, botResponse);

    // Limit the cache size by removing the least recently used entry
    if (responseCache.size > MAX_CACHE_SIZE) {
      const leastRecentlyUsedKey = responseCache.keys().next().value;
      responseCache.delete(leastRecentlyUsedKey);
    }

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
