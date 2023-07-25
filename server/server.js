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

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hi Sister'
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Check if the same prompt was requested recently, and reuse the response.
    if (lastResponse && lastResponse.prompt === prompt) {
      return res.status(200).send({
        bot: lastResponse.bot
      });
    }

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0.8, // Using a slightly higher temperature for more creative responses.
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
    res.status(500).send(error || 'Something went wrong');
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
