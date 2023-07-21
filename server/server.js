import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

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

// Simple in-memory cache to store API responses with a TTL of 1 millisecond
const responseCache = {};
const cacheTTL = 1; // 1 millisecond

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!',
  });
});

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Ensure prompt length is within a reasonable limit (e.g., <= 1024 characters)
    const maxPromptLength = 1024;
    if (prompt.length > maxPromptLength) {
      return res.status(400).send({ error: 'Prompt is too long. Please keep it within the character limit.' });
    }

    // Check if the response is cached and return the cached response
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // Send the request to the AI model with a timeout of 15 seconds
    const responsePromise = openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ error: 'AI response timeout' }), 15000)
    );

    // Wait for the AI request or timeout to complete, whichever happens first
    const { data } = await Promise.race([responsePromise, timeoutPromise]);

    if (data && data.choices && data.choices.length > 0) {
      const botResponse = data.choices[0].text;
      responseCache[prompt] = botResponse;
      setTimeout(() => delete responseCache[prompt], cacheTTL); // Add TTL for cached responses
      return res.status(200).send({ bot: botResponse });
    } else {
      return res.status(500).send({ error: 'AI response error' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Something went wrong' });
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).send({ error: 'Something went wrong' });
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
