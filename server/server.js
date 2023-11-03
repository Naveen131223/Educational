import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import readlineSync from 'readline-sync';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY || null; // Set apiKey to null initially

let openai;
if (apiKey) {
  const configuration = new Configuration({
    apiKey,
  });
  openai = new OpenAIApi(configuration);
}

app.get('/', async (req, res) => {
  const defaultResponses = [
    "How can I assist you?",
    "How can I help you?",
    "Is there anything else you'd like to know?",
    "Feel free to ask any questions.",
    "I'm here to help. What can I do for you?",
  ];

  const randomIndex = Math.floor(Math.random() * defaultResponses.length);
  const defaultMessage = defaultResponses[randomIndex];

  res.status(200).send({
    message: 'Hello from CodeX!',
    defaultResponse: defaultMessage,
  });
});

app.post('/', async (req, res) => {
  try {
    if (!openai) {
      return res.status(403).send({
        error: 'OpenAI API key not provided.',
      });
    }

    const prompt = req.body.prompt;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    res.status(200).send({
      bot: response.data.choices[0].text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));

function askUserForApiKey() {
  const apiKey = readlineSync.question('Enter your OpenAI API key: ');
  return apiKey;
}
