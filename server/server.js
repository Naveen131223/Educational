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
app.use(express.json()); // Apply JSON parsing only to the '/post' route

// Cache the OpenAI instance for all incoming requests
app.use((req, res, next) => {
  req.openai = openai;
  next();
});

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!',
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await req.openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    // Send only the bot's response text instead of the entire API response object
    res.status(200).send({
      bot: response.data.choices[0].text,
    });
  } catch (error) {
    console.error(error);
    // Include error message in the response to aid debugging
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
