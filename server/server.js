import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple in-memory cache to store generated responses
const responseCache = {};
let isModelReady = true; // Since we're not using an external API, assume it's always ready

app.use((req, res, next) => {
  if (!isModelReady) {
    return res.status(200).send({
      message: 'Initializing model, please wait...',
    });
  }
  next();
});

app.get('/status', (req, res) => {
  if (isModelReady) {
    return res.status(200).send({
      status: 'Model is ready!',
    });
  }
  res.status(200).send({
    status: 'Model is initializing...',
  });
});

app.get('/', (req, res) => {
  // If the model is ready, return a placeholder response immediately
  return res.status(200).send({
    bot: 'Placeholder response',
  });
});

app.post('/', (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Sanitize and escape the input prompt to prevent XSS attacks
    prompt = sanitizeInput(prompt);

    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // Generate a random response using the faker library
    const faker = require('faker');
    const botResponse = faker.lorem.paragraph();

    responseCache[prompt] = botResponse;

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
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});

function sanitizeInput(input) {
  return input.replace(/[&<>"'\/]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      case '/':
        return '&#x2F;';
      default:
        return char;
    }
  });
}
