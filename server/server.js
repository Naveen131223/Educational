import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import redis from 'redis'; // Make sure to install 'redis' npm package

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

// Initialize Redis client (Update with your Redis connection details)
const redisClient = redis.createClient({
  host: 'localhost', // Replace with your Redis server host
  port: 6379, // Replace with your Redis server port
});

// Pre-warm the AI Model during server startup
const WARM_UP_PROMPT = 'Warm-up prompt';
initializeAIModel();

async function initializeAIModel() {
  try {
    console.log('Initializing AI model...');
    const response = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: WARM_UP_PROMPT,
    });

    const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
    responseCache[WARM_UP_PROMPT] = botResponse;

    // Store the response in Redis for persistent caching
    redisClient.set(WARM_UP_PROMPT, botResponse);

    console.log('AI model is ready!');
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
  if (responseCache[prompt]) {
    console.log('Cache hit for prompt:', prompt);
    return res.status(200).send({ bot: responseCache[prompt] });
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

    // Check if the response is cached in Redis
    redisClient.get(prompt, async (error, cachedResponse) => {
      if (error) {
        console.error('Error fetching from cache:', error);
      }

      if (cachedResponse) {
        console.log('Cache hit for prompt:', prompt);
        responseCache[prompt] = cachedResponse;
        return res.status(200).send({ bot: cachedResponse });
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
      responseCache[prompt] = botResponse;

      // Store the response in Redis for persistent caching
      redisClient.set(prompt, botResponse);

      res.status(200).send({ bot: botResponse });
    });
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

let isAIModelReady = false; // Flag to check if the AI model is ready
const responseCache = {};

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
