import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

// Store the last response to be reused if the same prompt is requested again.
let lastResponse = null;

// Sample rate limiting implementation (Adjust as per your requirements)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitMap = new Map();

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Rate Limiting Check
    const clientIp = req.ip; // Requires trust proxy setting
    const currentTime = Date.now();
    let requestCount = rateLimitMap.get(clientIp) || 0;

    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).send('Too many requests. Please try again later.');
    }

    rateLimitMap.set(clientIp, requestCount + 1);

    setTimeout(() => {
      rateLimitMap.set(clientIp, (rateLimitMap.get(clientIp) || 1) - 1);
    }, RATE_LIMIT_WINDOW_MS);

    // Check if the same prompt was requested recently, and reuse the response.
    if (lastResponse && lastResponse.prompt === prompt) {
      return res.status(200).send({
        bot: lastResponse.bot
      });
    }

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0.7, // Using a slightly higher temperature for more creative responses.
      max_tokens: 150, // Limiting the response length to improve speed.
    });

    const botResponse = response.data.choices[0].text;

    // Cache the current response for reuse.
    lastResponse = { prompt, bot: botResponse };

    res.status(200).send({
      bot: botResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
