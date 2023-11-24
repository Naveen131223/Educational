const express = require('express');
const cors = require('cors');
const gpt2 = require('gpt-2-simple');

const app = express();
const port = process.env.PORT || 5000;

let gptModel;

app.use(cors());
app.use(express.json());

async function initializeModel() {
  try {
    gptModel = await gpt2.loadModel({ fromCache: true });
    console.log('GPT-2 model loaded.');
  } catch (error) {
    console.error('Error loading GPT-2 model:', error);
  }
}

app.get('/', (req, res) => {
  res.status(200).send('Server is up and running!');
});

app.post('/getResponse', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Generate response using the initialized GPT-2 model
    const botResponse = await gpt2(gptModel, prompt);

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

const server = app.listen(port, async () => {
  await initializeModel();
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
