import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PLAYGROUND_URL = 'https://play.openai.com';

// Middleware to check if the AI model is ready before processing requests
let isAIModelReady = false;

app.use((req, res, next) => {
  if (!isAIModelReady) {
    return res.status(200).send({
      message: 'Initializing AI model, please wait...',
    });
  }
  next();
});

app.get('/status', (req, res) => {
  if (isAIModelReady) {
    return res.status(200).send({
      status: 'AI model is ready!',
    });
  }
  res.status(200).send({
    status: 'AI model is initializing...',
  });
});

app.get('/', (req, res) => {
  // If the AI model is ready, return the response from the Playground
  return res.redirect(PLAYGROUND_URL);
});

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Send the prompt to the Playground API
    const response = await axios.post(PLAYGROUND_URL + '/api/chat/completions', {
      messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
    });

    const botResponse = response.data.choices[0]?.message?.content || 'No response from the AI model.';
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

// Start the server
const server = app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
  isAIModelReady = true;
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
