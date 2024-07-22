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

let cache = {};

// Function to clear the cache
const clearCache = () => {
  cache = {};
  console.log('Cache cleared successfully');
};

// Set intervals
const cacheClearInterval = 7 * 60 * 1000; // 7 minutes in milliseconds
setInterval(clearCache, cacheClearInterval);

const sanitizeResponse = (response) => {
  let sanitized = response.replace("Here is the response:", "");
  return sanitized.replace(/[!@#*]/g, '').replace(/(\.\.\.|…)*$/, '').trim();
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
  5: { words: 150 },
  6: { words: 190 },
  7: { words: 240, subtopics: 'detailed explanation, multiple examples, and analysis' },
  8: { words: 290, subtopics: 'multiple subtopics, examples, explanations, and analysis' },
  10: { words: 530, subtopics: 'detailed exploration, several subtopics, introduction, main content, and conclusion' },
  12: { words: 630, subtopics: 'comprehensive coverage, numerous subtopics, in-depth analysis, examples, and conclusion' },
  15: { words: 680, subtopics: 'extensive subtopics, background information, detailed explanations, case studies, critical analysis, and strong conclusion' },
  20: { words: 880, subtopics: 'thorough coverage, extensive subtopics, historical context, detailed arguments, multiple perspectives, in-depth analysis, case studies, and comprehensive conclusion' }
};

const isAskingForDate = (prompt) => {
  const dateKeywords = [
    'date', 'current date', 'what date', 'today\'s date', 'current day'
  ];
  const normalizedPrompt = prompt.trim().toLowerCase();
  return dateKeywords.some(keyword => normalizedPrompt.includes(keyword));
};

const getCurrentDate = () => {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return now.toLocaleString('en-US', options);
};

const mentionsDiagram = (prompt) => {
  return prompt.toLowerCase().includes('diagram');
};

// Function to retrieve cached response or null if not cached
const getCachedResponse = (prompt) => {
  return cache[prompt] || null;
};

// Function to cache response
const cacheResponse = (prompt, response) => {
  cache[prompt] = response;
};

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hi Sister'
  });
});

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      console.log('Response retrieved from cache:', cachedResponse);
      return res.status(200).send({ bot: cachedResponse });
    }

    if (isGreeting(prompt)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      cacheResponse(prompt, randomResponse);
      return res.status(200).send({ bot: randomResponse });
    }

    if (isAskingForDate(prompt)) {
      const currentDate = getCurrentDate();
      cacheResponse(prompt, `The current date is: ${currentDate}`);
      return res.status(200).send({ bot: `The current date is: ${currentDate}` });
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
      const pointsRequested = parseInt(pointsMatch[1], 10);
      const adjustedPoints = pointsRequested + 3;
      maxWords = adjustedPoints * 10; // assume roughly 10 words per point/step
    }

    if (subtopics) {
      prompt += ` Please cover the following subtopics: ${subtopics}.`;
    } else if (maxWords) {
      prompt += ` Please provide the correct response in ${maxWords} words.`;
    } else {
      prompt += " Provide an accurate response.";
    }

    if (mentionsDiagram(prompt)) {
      prompt += " Include a title name with the diagram name in text.";
    }

    const maxNewTokens = Math.floor(Math.min((maxWords || 100) * 1.5, 2000)); // Ensure integer value

    axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.7, // increased temperature for more creative responses
        max_new_tokens: maxNewTokens, // ensure this is an integer
        top_p: 0.9 // nucleus sampling, adjusted to be within the valid range
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    }).then(response => {
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

      // Remove the subtopics prompt from the response if present
      if (subtopics && botResponse.includes(subtopics)) {
        botResponse = botResponse.replace(subtopics, '').trim();
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

      // Add a space at the beginning of the response
      botResponse = ' ' + botResponse;

      // Cache the response for future requests with the same prompt
      cacheResponse(prompt, botResponse);

      res.status(200).send({ bot: botResponse });

    }).catch(error => {
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
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send({ error: 'Unexpected error occurred' });
  }
});

// Graceful shutdown logic
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if the server is still running
  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

// Health check and server restart logic
let failedHealthChecks = 0;
const MAX_FAILED_CHECKS = 9; // Set to 9 as per your requirement

const checkHealthAndRestart = async () => {
  try {
    const response = await axios.get('http://localhost:5000/health');
    if (response.status !== 200) {
      failedHealthChecks++;
      if (failedHealthChecks >= MAX_FAILED_CHECKS) {
        console.log('Health check failed multiple times, restarting server...');
        gracefulShutdown();
      }
    } else {
      failedHealthChecks = 0; // Reset counter on successful health check
    }
  } catch (error) {
    failedHealthChecks++;
    if (failedHealthChecks >= MAX_FAILED_CHECKS) {
      console.log('Health check failed multiple times, restarting server...');
      gracefulShutdown();
    }
  }
};

// Set health check interval
const healthCheckInterval = 60 * 1000; // 1 minute
setInterval(checkHealthAndRestart, healthCheckInterval);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
      
