import express from 'express';
import * as dotenv from 'dotenv';
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

// Simple in-memory cache to store API responses
const responseCache = {};

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!'
  });
});

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Check if the response is cached
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // Send the request to the AI model asynchronously with a timeout
    const aiRequestPromise = openai.createCompletion({
      model: process.env.OPENAI_MODEL || 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    // Set a timeout for the AI request to ensure a 0.5-second response time
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 500));

    // Wait for both the AI request and the timeout to complete
    const [response] = await Promise.race([aiRequestPromise, timeoutPromise]);

    if (response) {
      const botResponse = response.data.choices[0]?.text || 'No response from the AI model.';
      responseCache[prompt] = botResponse;
      return res.status(200).send({ bot: botResponse });
    } else {
      // If the AI request took longer than 0.5 seconds, respond with a cached response or default message
      const cachedResponse = responseCache[prompt] || 'No response from the AI model.';
      return res.status(200).send({ bot: cachedResponse });
    }
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
