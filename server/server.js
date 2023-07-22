import express from 'express';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
const port = process.env.PORT || 5000;
const model = process.env.OPENAI_MODEL || 'text-davinci-003';
const maxTokens = 3000;

app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Please provide an OPENAI_API_KEY in your environment variables.');
  process.exit(1);
}

const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

// Simple in-memory cache to store AI responses' choices
const responseCache = {};

async function preloadModel() {
  try {
    const prompt = 'Preloading AI model...'; // A placeholder prompt for preloading
    await openai.createCompletion({ model, prompt, temperature: 0, max_tokens: 1 });
    console.log('AI model preloaded successfully!');
  } catch (error) {
    console.error('Failed to preload AI model:', error);
    process.exit(1);
  }
}

preloadModel(); // Preload the AI model asynchronously during server startup

function validatePrompt(prompt) {
  return typeof prompt === 'string' && prompt.trim() !== '';
}

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!validatePrompt(prompt)) {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Check if the response choices are cached
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      return res.status(200).send({ bot: responseCache[prompt] });
    }

    // Send the request to the AI model asynchronously
    const aiResponse = await openai.createCompletion({
      model,
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const botResponse = aiResponse.data.choices?.[0]?.text || 'No response from the AI model.';
    responseCache[prompt] = aiResponse.data.choices; // Cache the model's choices array

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

// Start the server and handle graceful shutdown
const server = app.listen(port, () => {
  console.log(`AI server started on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
