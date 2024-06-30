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
    console.log('Model status checked successfully');
  } catch (error) {
    console.error('Error checking model status:', error);
  }
};

// Check model status every 5 minutes
setInterval(checkModelLoaded, 5 * 60 * 1000); // Check every 5 minutes
checkModelLoaded();

const sanitizeResponse = (response) => {
  return response.replace(/[!@#*]/g, '').replace(/(\.\.\.|…)*$/, '').trim();
};

const responses = [
  "How can I assist you?",
  "How can I help you?",
  "Is there anything else you'd like to know?",
  "Feel free to ask any questions.",
  "I'm here to help. What can I do for you?",
];

const isGreeting = (prompt) => {
  const greetings = [
    'hi', 'hello', 'hey', 'hi bro', 'hi sister', 'hello there', 'hey there'
  ];
  const normalizedPrompt = prompt.trim().toLowerCase();
  return greetings.includes(normalizedPrompt);
};

const markCategories = {
  1: { words: 20 },
  2: { words: 50 },
  3: { words: 70 },
  4: { words: 90 },
  5: { words: 120 },
  6: { words: 150 },
  7: { words: 200 },
  8: { words: 250, subtopics: 'multiple subtopics, examples, explanations, and analysis' },
  10: { words: 400, subtopics: 'detailed exploration, several subtopics, introduction, main content, and conclusion' },
  12: { words: 500, subtopics: 'comprehensive coverage, numerous subtopics, in-depth analysis, examples, and conclusion' },
  15: { words: 600, subtopics: 'extensive subtopics, background information, detailed explanations, case studies, critical analysis, and strong conclusion' },
  20: { words: 800, subtopics: 'thorough coverage, extensive subtopics, historical context, detailed arguments, multiple perspectives, in-depth analysis, case studies, and comprehensive conclusion' }
};

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

    if (isGreeting(prompt)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return res.status(200).send({ bot: randomResponse });
    }

    const promptLowerCase = prompt.toLowerCase();
    let maxWords = null;
    let subtopics = null;

    const markMatch = promptLowerCase.match(/(\d+)\s*marks?/i);
    const wordMatch = promptLowerCase.match(/(\d+)\s*words?/i);
    const pointsMatch = promptLowerCase.match(/(\d+)\s*(points?|steps?)/i);

    if (markMatch) {
      const marks = parseInt(markMatch[1], 10);
      if (markCategories[marks]) {
        maxWords = markCategories[marks].words;
        subtopics = markCategories[marks].subtopics;
      }
    } else if (wordMatch) {
      maxWords = parseInt(wordMatch[1], 10);
    } else if (pointsMatch) {
      maxWords = parseInt(pointsMatch[1], 10) * 10; // assume roughly 10 words per point/step
    }

    if (subtopics) {
      prompt += ` Please cover the following subtopics: ${subtopics}.`;
    } else if (maxWords) {
      prompt += ` Please provide the answer in ${maxWords} words.`;
    } else {
      prompt += " Provide an accurate answer.";
    }

    const maxNewTokens = Math.min((maxWords || 100) * 1.5, 1500); // Estimate tokens based on words

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
    botResponse = sanitizeResponse(botResponse);

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);

    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      res.status(error.response.status).send({ error: error.response.data });
    } else if (error.request) {
      console.error('Error request:', error.request);
      res.status(500).send({ error: 'No response received from Hugging Face API' });
    } else {
      console.error('Error message:', error.message);
      res.status(500).send({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`AI server started on http://localhost:${PORT}`);
});

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

// Keep-alive mechanism to prevent spin-down
const keepAlive = () => {
  axios.get(`http://localhost:${PORT}/`)
    .then(() => console.log('Keep-alive ping successful'))
    .catch(err => console.error('Keep-alive ping failed:', err));
};

// Ping every 5 minutes to keep the server awake
setInterval(keepAlive, 5 * 60 * 1000);
  
