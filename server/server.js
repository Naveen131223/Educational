import express from 'express';
import cors from 'cors';
import { AutoModelForCausalLM, AutoTokenizer } from '@transformers';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const tokenizer = AutoTokenizer.fromPretrained('gpt2');
const model = AutoModelForCausalLM.fromPretrained('gpt2');

const responseCache = {};
let isModelReady = false;

async function initializeModel() {
  try {
    // Add any necessary initialization logic for your model here
    isModelReady = true;
  } catch (error) {
    console.error('Error initializing the model:', error);
  }
}

// Middleware to check if the model is ready before processing requests
app.use((req, res, next) => {
  if (!isModelReady) {
    return res.status(200).send({
      message: 'Initializing model, please wait...',
    });
  }
  next();
});

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    const input = tokenizer.encode(prompt, { return_tensors: 'pt' });
    const output = await model.generate(input);

    const botResponse = tokenizer.decode(output[0], { skipSpecialTokens: true }) || 'No response from the model.';
    responseCache[prompt] = botResponse;

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Something went wrong');
  }
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

const server = app.listen(port, async () => {
  console.log(`Server started on http://localhost:${port}`);
  await initializeModel();
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
