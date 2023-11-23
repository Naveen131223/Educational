import express from 'express';
import cors from 'cors';
import { GPT, GPTResponse } from 'openai';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const gpt = new GPT({ key: process.env.OPENAI_API_KEY });

let isServerReady = true;

app.use((req, res, next) => {
  if (!isServerReady) {
    return res.status(200).send({
      message: 'Server is initializing, please wait...',
    });
  }
  next();
});

app.get('/status', (req, res) => {
  if (isServerReady) {
    return res.status(200).send({
      status: 'Server is ready!',
    });
  }
  res.status(200).send({
    status: 'Server is initializing...',
  });
});

app.get('/', (req, res) => {
  return res.status(200).send({
    bot: 'Placeholder response. Replace this with your desired logic.',
  });
});

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    const botResponse = await generateResponse(prompt);

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong');
});

const server = app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
  isServerReady = true;
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});

async function generateResponse(prompt): Promise<string> {
  // Example using GPT-2.5-turbo
  const response: GPTResponse = await gpt.complete({
    prompt: prompt,
    model: 'gpt-2.5-turbo',
  });

  return response.choices[0]?.text || 'No response from the language model.';
}
