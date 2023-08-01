import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_FREQUENCY_PENALTY = 0.5;
const DEFAULT_PRESENCE_PENALTY = 0;

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!',
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt || "Default prompt if not provided.";

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: req.body.temperature || DEFAULT_TEMPERATURE,
      max_tokens: req.body.max_tokens || DEFAULT_MAX_TOKENS,
      top_p: req.body.top_p || 1,
      frequency_penalty: req.body.frequency_penalty || DEFAULT_FREQUENCY_PENALTY,
      presence_penalty: req.body.presence_penalty || DEFAULT_PRESENCE_PENALTY,
    });

    res.status(200).send({
      bot: response.data.choices[0].text,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || 'Something went wrong');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
