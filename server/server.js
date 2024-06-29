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
    const greetings = [
      'hi', 'hello', 'hey', 'hi bro', 'hi sister', 'hello there', 'hey there',
      'Hi', 'Hello', 'Hey', 'Hi Bro', 'Hi Sister', 'Hello There', 'Hey There'
    ];
    const normalizedPrompt = prompt.trim().toLowerCase();
    let isGreeting = greetings.some(greeting => normalizedPrompt === greeting.toLowerCase());

    // Predefined responses for greetings
    const greetingResponses = [
      "How can I assist you?",
      "How can I help you?",
      "Is there anything else you'd like to know?",
      "Feel free to ask any questions.",
      "I'm here to help. What can I do for you?",
    ];

    // Determine token allocation based on prompt complexity
    const promptLength = prompt.split(' ').length;
    let maxNewTokens = 1500; // default for longer prompts
    let maxWords = null;

    if (isGreeting) {
      // Select a random greeting response
      const responseIndex = Math.floor(Math.random() * greetingResponses.length);
      return res.status(200).send({ bot: greetingResponses[responseIndex] });
    } else if (promptLength <= 3) {
      maxNewTokens = 50; // use fewer tokens for short prompts
      maxWords = 40; // limit the response to 40 words
    } else if (promptLength <= 10) {
      maxNewTokens = 200; // allocate more tokens for slightly longer prompts
    } else if (promptLength <= 20) {
      maxNewTokens = 500; // allocate more tokens for longer prompts
    }

    // Extract any specific word count, steps, or points requirement
    const wordMatch = prompt.match(/(\d+)\s*words/i);
    const pointsMatch = prompt.match(/(\d+)\s*(points|steps)/i);

    if (wordMatch) {
      maxWords = parseInt(wordMatch[1], 10);
    } else if (pointsMatch) {
      maxWords = parseInt(pointsMatch[1], 10) * 10; // assume roughly 10 words per point/step
    } else {
      prompt += " provide an accurate response alone is enough.";
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

    // Remove unwanted symbols
    botResponse = botResponse.replace(/[*#@]/g, '');

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
