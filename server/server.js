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
    let { prompt } = req.body;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    // Check for greetings
    const greetings = ['hi', 'hello', 'hey', 'hi bro', 'hi sister', 'hello there', 'hey there'];
    let isGreeting = greetings.some(greeting => prompt.toLowerCase().startsWith(greeting.toLowerCase()));

    // Extract any specific word count, steps, or points requirement
    let maxNewTokens = 1500; // default for longer prompts
    let maxWords = null;
    let specificRequirement = false;

    const wordMatch = prompt.match(/(\d+)\s*words/i);
    const pointsMatch = prompt.match(/(\d+)\s*(points|steps)/i);

    if (wordMatch) {
      maxWords = parseInt(wordMatch[1], 10);
      specificRequirement = true;
    } else if (pointsMatch) {
      maxWords = parseInt(pointsMatch[1], 10) * 10; // assume roughly 10 words per point/step
      specificRequirement = true;
    }

    if (isGreeting || prompt.split(' ').length <= 3) {
      maxNewTokens = 50; // use fewer tokens for short prompts or greetings
      maxWords = 40; // limit the response to 40 words
    } else if (!specificRequirement) {
      prompt += " provide an accurate answer.";
    }

    const response = await axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.7, // increased temperature for more creative responses
        max_new_tokens: maxNewTokens, // adjust based on prompt length
        top_p: 0.9 // nucleus sampling, adjusted to be within the valid range
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response from Hugging Face API:', response.data);

    let botResponse = 'No response generated';

    if (response.data && response.data.length > 0) {
      botResponse = response.data[0].generated_text || 'No response generated';
    } else if (response.data && response.data.generated_text) {
      botResponse = response.data.generated_text;
    }

    // Ensure the response does not repeat the prompt and handle truncation more robustly
    if (botResponse.toLowerCase().startsWith(prompt.toLowerCase())) {
      botResponse = botResponse.slice(prompt.length).trim();
    }

    // Trim based on sentence boundaries or specific criteria
    const sentences = botResponse.split('.'); // Split into sentences
    if (sentences.length > 1) {
      botResponse = sentences.slice(0, -1).join('.').trim() + '.';
    } else {
      botResponse = botResponse.trim();
    }

    // If maxWords is specified, limit the response to the specified number of words
    if (maxWords) {
      const words = botResponse.split(' ');
      if (words.length > maxWords) {
        botResponse = words.slice(0, maxWords).join(' ') + '.';
      }
    }

    // Remove any leading punctuation
    botResponse = botResponse.replace(/^[!?.]*\s*/, '');

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

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
