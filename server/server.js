import express from 'express';
import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import { promisify } from 'util';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();

// Middleware to parse JSON body and limit request size
app.use(bodyParser.json({ limit: '1mb' }));

// Rate Limiting (Limit to 100 requests per 10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Simple in-memory cache for responses
const responseCache = new Map();

// Your API endpoint for processing the AI model
app.post('/api/process', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Input Validation (sanitize user input if necessary)
    if (!validator.isLength(prompt, { min: 1, max: 1000 })) {
      return res.status(400).send('Invalid prompt length.');
    }

    // Check if the response is already cached in the in-memory Map
    if (responseCache.has(prompt)) {
      res.status(200).send({
        bot: responseCache.get(prompt),
      });
    } else {
      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `${prompt}`,
        temperature: 0,
        max_tokens: 3000,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
      });

      const botResponse = response.data.choices[0].text;

      // Cache the response in the in-memory Map for future requests
      responseCache.set(prompt, botResponse);

      res.status(200).send({
        bot: botResponse,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default app;
