import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import cache from 'memory-cache'; // Add the memory-cache library (you can install it with "npm install memory-cache")

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

const ONE_HOUR = 60 * 60 * 1000; // Cache responses for 1 hour (you can adjust this value if needed)

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Check if the response is cached
    const cachedResponse = cache.get(prompt);
    if (cachedResponse) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: cachedResponse });
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
    cache.put(prompt, botResponse, ONE_HOUR); // Cache the response for one hour

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
