const express = require('express');
const cors = require('cors');
const gpt2 = require('gpt-2-simple');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Server is up and running!');
});

app.post('/getResponse', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Generate response using dynamically loaded GPT-2 model
    const botResponse = await generateResponse(prompt);

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});

async function generateResponse(prompt) {
  try {
    // Load the GPT-2 model dynamically from the online source
    const model = await gpt2.loadModel({ fromCache: false });

    // Generate response using the loaded model
    const botResponse = await gpt2(model, prompt);

    // Unload the model to free up memory (optional)
    await gpt2.unloadModel(model);

    return botResponse;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}
