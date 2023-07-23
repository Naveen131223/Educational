import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import path from 'path';

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

// Request Validation Middleware
function validateRequest(req, res, next) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
  }

  // If the request is valid, continue to the next middleware or route handler
  next();
}

// Error Logging Middleware
function logErrors(err, req, res, next) {
  console.error(err.stack);
  // Log the error using your preferred logging mechanism (e.g., logging to a file or a centralized service)
  next(err);
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).send('Something went wrong');
}

// Start the server and preload the AI model in the background
async function startServer() {
  try {
    // Start the server and listen for incoming requests
    const server = app.listen(port, () => {
      console.log(`AI server started on http://localhost:${port}`);
    });

    // Preload the AI model in the background
    preloadModel();

    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server has been closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1); // If an error occurs during server startup, exit the process
  }
}

startServer();

// Apply Request Validation Middleware to all routes
app.use(validateRequest);

// Apply Error Logging Middleware
app.use(logErrors);

// Apply Error Handler Middleware
app.use(errorHandler);

// File path for the cache
const cacheFilePath = path.join(__dirname, 'ai_responses_cache.json');

// Read the cache from the file
function readCache() {
  try {
    const cacheData = fs.readFileSync(cacheFilePath, 'utf-8');
    return JSON.parse(cacheData);
  } catch (error) {
    return {};
  }
}

// Write the cache to the file
function writeCache(cache) {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Read the cached responses from the file
    const responseCache = readCache();

    // Check if the response is cached
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // Send the request to the AI model asynchronously
    const aiResponse = await openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const botResponse = aiResponse.data.choices[0]?.text || 'No response from the AI model.';
    responseCache[prompt] = botResponse;

    // Cache the response in the file
    writeCache(responseCache);

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Apply Error Logging Middleware and other middleware remains the same
// ...
