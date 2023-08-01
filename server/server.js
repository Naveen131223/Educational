import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import rateLimit from 'express-rate-limit';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

// Create a rate limiter to limit the number of requests
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});

app.use(limiter);

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!',
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).send({ error: 'Invalid request. "prompt" must be a non-empty string.' });
    }

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].text) {
      return res.status(200).send({
        bot: response.data.choices[0].text,
      });
    } else {
      return res.status(500).send({ error: 'Something went wrong with the AI response.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`AI server started on http://localhost:${port}`));
