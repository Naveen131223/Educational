// server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Read conversational pairs from the text file during initialization
const textFilePath = path.join(__dirname, 'conversations.txt');
const conversationalPairs = parseConversationalPairs(fs.readFileSync(textFilePath, 'utf-8'));

// Simple in-memory cache to store responses
const responseCache = {};
let isModelReady = false; // Flag to check if the model is ready

// Initialize the model asynchronously during server startup
const modelInitializationPromise = initializeModel();

async function initializeModel() {
  try {
    console.log('Initializing model...');
    console.log('Model is ready!');
    isModelReady = true;
  } catch (error) {
    console.error('Error initializing model:', error);
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

app.post('/', (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Sanitize and escape the input prompt to prevent XSS attacks
    prompt = sanitizeInput(prompt);

    // Search for the prompt in the conversational pairs
    const foundResponse = findResponseInConversations(prompt);

    if (foundResponse) {
      console.log('Response found in conversations for prompt:', prompt);
      return res.status(200).send({ bot: foundResponse });
    }

    // Attempt to find a response based on partial matching
    const partialMatchResponse = findPartialMatchResponse(prompt);

    if (partialMatchResponse) {
      console.log('Partial match found for prompt:', prompt);
      return res.status(200).send({ bot: partialMatchResponse });
    }

    res.status(200).send({ bot: "I'm sorry, I don't understand that." });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// ... (remaining code remains unchanged)

function sanitizeInput(input) {
  // Sanitization logic remains unchanged
}

function parseConversationalPairs(text) {
  // Parse text into conversational pairs (user prompt and AI response)
  const pairs = [];
  const lines = text.split('\n');
  let currentUserPrompt = '';
  for (const line of lines) {
    if (line.startsWith('User: ')) {
      currentUserPrompt = line.substring('User: '.length);
    } else if (line.startsWith('AI: ')) {
      const aiResponse = line.substring('AI: '.length);
      pairs.push({ user: currentUserPrompt, ai: aiResponse });
    }
  }
  return pairs;
}

function findResponseInConversations(userPrompt) {
  // Search for the user prompt in the conversational pairs
  for (const pair of conversationalPairs) {
    if (pair.user.toLowerCase() === userPrompt.toLowerCase()) {
      return pair.ai;
    }
  }
  return null;
}

function findPartialMatchResponse(userPrompt) {
  // Advanced partial matching using natural language processing techniques
  const similarityThreshold = 0.6; // Adjust this threshold based on your needs

  for (const pair of conversationalPairs) {
    const similarity = calculateSimilarity(pair.user.toLowerCase(), userPrompt.toLowerCase());

    if (similarity >= similarityThreshold) {
      return pair.ai;
    }
  }

  return null;
}

function calculateSimilarity(str1, str2) {
  // Implement a similarity calculation algorithm (e.g., Jaccard similarity, Levenshtein distance)
  // This is a placeholder, and you may replace it with a more sophisticated method
  const intersection = str1.split(' ').filter(word => str2.split(' ').includes(word));
  const union = [...new Set([...str1.split(' '), ...str2.split(' ')])];

  return intersection.length / union.length;
}

// Start the server after the model is initialized
modelInitializationPromise.then(() => {
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
});
