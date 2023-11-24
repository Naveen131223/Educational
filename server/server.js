const express = require('express');
const cors = require('cors');
const gpt2 = require('gpt-2-simple');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple in-memory cache
const responseCache = {};

// Load the GPT-2 model initially
let gptModel;

(async () => {
  try {
    gptModel = await gpt2.loadModel({ fromCache: true });
    console.log('GPT-2 model loaded.');
  } catch (error) {
    console.error('Error loading GPT-2 model:', error);
  }
})();

app.get('/', (req, res) => {
  res.status(200).send('Server is up and running!');
});

app.post('/getResponse', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Check if the response is cached
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // If not cached, generate response using GPT-2
    const botResponse = await generateResponse(prompt);

    // Cache the response
    responseCache[prompt] = botResponse;

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Periodically load the GPT-2 model into memory (every 24 hours in this example)
setInterval(async () => {
  console.log('Reloading GPT-2 model into memory...');
  try {
    gptModel = await gpt2.loadModel({ fromCache: true });
    console.log('GPT-2 model reloaded.');
  } catch (error) {
    console.error('Error reloading GPT-2 model:', error);
  }
}, 24 * 60 * 60 * 1000); // Reload every 24 hours

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});

async function generateResponse(prompt) {
  try {
    // Generate response using the loaded GPT-2 model
    const botResponse = await gpt2(gptModel, prompt);

    return botResponse;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}
