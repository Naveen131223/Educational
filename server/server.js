const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const rateLimit = require('express-rate-limit');

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

// Create a cache to store AI responses
const responseCache = new Map();

// A function to call the AI API and store the response in the cache
async function getAIResponse(prompt) {
  if (responseCache.has(prompt)) {
    return responseCache.get(prompt);
  }

  try {
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
    responseCache.set(prompt, botResponse);
    return botResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Create a rate limiter to limit the number of requests with async option
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  handler: (req, res) => {
    res.status(429).send('Too many requests, please try again later.');
  },
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

    const botResponse = await getAIResponse(prompt);

    res.status(200).send({
      bot: botResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`AI server started on http://localhost:${port}`));
