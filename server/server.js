import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct';
const HF_API_KEY = process.env.HF_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

let modelLoaded = false;
const cache = {};

// Function to check if the model is loaded
const checkModelLoaded = async () => {
  try {
    const response = await axios.get(HF_API_URL, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`
      }
    });
    modelLoaded = response.status === 200;
  } catch (error) {
    console.error('Error checking model status:', error);
  }
};

// Check model status every minute
setInterval(checkModelLoaded, 60000);
checkModelLoaded();

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!'
  });
});

app.post('/', async (req, res) => {
  if (!modelLoaded) {
    return res.status(503).send({ error: 'Model is loading, please try again later' });
  }

  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    // Check if the response is in the cache
    if (cache[prompt]) {
      return res.status(200).send({ bot: cache[prompt] });
    }

    const response = await axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.7,
        max_new_tokens: 1300,
        top_p: 0.9
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

    // Ensure the response does not repeat the prompt and does not end with ellipses unnecessarily
    if (botResponse.toLowerCase().startsWith(prompt.toLowerCase())) {
      botResponse = botResponse.slice(prompt.length).trim();
    }
    botResponse = botResponse.replace(/(\.\.\.|…)*$/, '');

    // Cache the response
    cache[prompt] = botResponse;

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);

    if (error.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      res.status(error.response.status).send({ error: error.response.data });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      res.status(500).send({ error: 'No response received from Hugging Face API' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      res.status(500).send({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
