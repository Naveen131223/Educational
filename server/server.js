import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/blenderbot-3B';
const HF_API_KEY = process.env.HF_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

// In-memory cache
const responseCache = {};

// Simulate a typing delay
const simulateTypingDelay = (text) => {
  const typingSpeed = 20; // characters per second (slower for more detailed response)
  return new Promise(resolve => setTimeout(resolve, (text.length / typingSpeed) * 1000));
};

// Helper function to enhance response generation
const enhanceResponse = (text, desiredWordCount) => {
  const words = text.split(' ');
  if (words.length > desiredWordCount) {
    return words.slice(0, desiredWordCount).join(' ') + '...';
  } else if (words.length < desiredWordCount) {
    const additionalWords = new Array(desiredWordCount - words.length).fill('...');
    return text + ' ' + additionalWords.join(' ');
  }
  return text;
};

app.get('/', (req, res) => {
  res.status(200).send({ message: 'Hello from CodeX!' });
});

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    // Check cache for existing response
    if (responseCache[prompt]) {
      console.log('Cache hit for prompt:', prompt);
      const cachedResponse = responseCache[prompt];
      await simulateTypingDelay(cachedResponse);
      return res.status(200).send({ bot: cachedResponse });
    }

    const response = await axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        max_length: 3000, // The maximum number of tokens to generate in the completion
        temperature: 0.9, // Higher values means the model will take more risks
        top_p: 1, // Nucleus sampling
        frequency_penalty: 0.5, // Number between -2.0 and 2.0
        presence_penalty: 0 // Number between -2.0 and 2.0
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response from Hugging Face API:', response.data);

    let botResponse;
    if (response.data.generated_text) {
      botResponse = response.data.generated_text.trim();
    } else if (response.data[0] && response.data[0].generated_text) {
      botResponse = response.data[0].generated_text.trim();
    } else {
      botResponse = 'No response generated';
    }

    // Adjust the response length based on the prompt length
    const promptLength = prompt.split(' ').length;
    let desiredWordCount;

    if (promptLength <= 10) {
      desiredWordCount = 100;
    } else if (promptLength <= 20) {
      desiredWordCount = 200;
    } else {
      desiredWordCount = 300;
    }

    botResponse = enhanceResponse(botResponse, desiredWordCount);

    // Store response in cache
    responseCache[prompt] = botResponse;

    // Simulate typing delay
    await simulateTypingDelay(botResponse);

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
