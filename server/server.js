import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

// Hugging Face API details
const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct';
const HF_API_KEY = process.env.HF_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

// In-memory cache to store responses
let cache = {};

// Function to clear the cache
const clearCache = () => {
  cache = {}; // Reset cache
  console.log('Cache cleared successfully');
};

// Function to clear the built-in module cache
const clearModuleCache = () => {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key];
  });
  console.log('Module cache cleared successfully');
};

// Set intervals to clear caches every 2 minutes
const cacheClearInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
setInterval(clearCache, cacheClearInterval);
setInterval(clearModuleCache, cacheClearInterval);

// Function to sanitize response text by removing unwanted characters
const sanitizeResponse = (response) => {
  return response.replace(/[!@#*]/g, '').replace(/(\.\.\.|…)*$/, '').trim();
};

// Predefined responses for greetings
const responses = [
  "How can I assist you?",
  "How can I help you?",
  "Is there anything else you'd like to know?",
  "Feel free to ask any questions.",
  "I'm here to help. What can I do for you?",
];

// Function to check if prompt is a greeting
const isGreeting = (prompt) => {
  const greetings = [
    'hi', 'hello', 'hey', 'hi bro', 'hi sister', 'hello there', 'hey there'
  ];
  return greetings.includes(prompt.trim().toLowerCase());
};

// Categories for word count based on marks or points
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

// Function to check if prompt is asking for the date
const isAskingForDate = (prompt) => {
  const dateKeywords = [
    'date', 'current date', 'what date', 'today\'s date', 'current day'
  ];
  return dateKeywords.some(keyword => prompt.trim().toLowerCase().includes(keyword));
};

// Function to get the current date in a readable format
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

// Function to check if the prompt mentions a diagram
const mentionsDiagram = (prompt) => {
  return prompt.toLowerCase().includes('diagram');
};

// Function to retrieve cached response
const getCachedResponse = (prompt) => {
  return cache[prompt] || null;
};

// Function to cache response for a prompt
const cacheResponse = (prompt, response) => {
  cache[prompt] = response;
};

// Endpoint to handle GET requests to root
app.get('/', (req, res) => {
  res.status(200).send({
    message: 'Hi Sister'
  });
});

// Endpoint to handle POST requests to root
app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    // Check if prompt is provided
    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    // Check if response is cached
    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      console.log('Response retrieved from cache:', cachedResponse);
      return res.status(200).send({ bot: cachedResponse });
    }

    // Handle greetings
    if (isGreeting(prompt)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      cacheResponse(prompt, randomResponse);
      return res.status(200).send({ bot: randomResponse });
    }

    // Handle date requests
    if (isAskingForDate(prompt)) {
      const currentDate = getCurrentDate();
      cacheResponse(prompt, `The current date is: ${currentDate}`);
      return res.status(200).send({ bot: `The current date is: ${currentDate}` });
    }

    // Process prompt for word count and subtopics
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
      maxWords = adjustedPoints * 10; // Assume roughly 10 words per point/step
    }

    // Append subtopics or word count to prompt
    if (subtopics) {
      prompt += ` Please cover the following subtopics: ${subtopics}.`;
    } else if (maxWords) {
      prompt += ` Please provide the correct response in ${maxWords} words.`;
    } else {
      prompt += " Provide an accurate response.";
    }

    // Append request for diagram if mentioned
    if (mentionsDiagram(prompt)) {
      prompt += " Include a title name with the diagram name in text.";
    }

    const maxNewTokens = Math.floor(Math.min((maxWords || 100) * 1.5, 2000)); // Ensure integer value

    // Call Hugging Face API
    axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.7, // Increased temperature for more creative responses
        max_new_tokens: maxNewTokens, // Ensure this is an integer
        top_p: 0.9 // Nucleus sampling
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    }).then(response => {
      console.log('Response from Hugging Face API:', response.data);

      let botResponse = 'No response generated';

      // Extract response text from API data
      if (response.data && response.data.length > 0) {
        botResponse = response.data[0].generated_text || 'No response generated';
      } else if (response.data && response.data.generated_text) {
        botResponse = response.data.generated_text;
      }

      // Remove prompt text if it repeats in response
      if (botResponse.toLowerCase().startsWith(prompt.toLowerCase())) {
        botResponse = botResponse.slice(prompt.length).trim();
      }

      // Remove subtopics prompt from response if present
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

      // Limit the response to the specified number of words
      if (maxWords) {
        const words = botResponse.split(' ');
        if (words.length > maxWords) {
          botResponse = words.slice(0, maxWords).join(' ');
        }
      }

      // Sanitize the response
      botResponse = sanitizeResponse(botResponse);
      cacheResponse(prompt, botResponse); // Cache the response
      res.status(200).send({ bot: botResponse });
    }).catch(error => {
      console.error('Error occurred while fetching response:', error);
      res.status(500).send({ error: 'Error occurred while fetching response' });
    });

  } catch (error) {
    console.error('Unexpected error occurred:', error);
    res.status(500).send({ error: 'Unexpected error occurred' });
  }
});

// Start the server on the specified port
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`AI server started on http://localhost:${PORT}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Function to handle graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Function to check health and restart server if necessary
const checkHealthAndRestart = async () => {
  try {
    const response = await axios.get('http://localhost:5000/health');
    if (response.status !== 200) {
      console.log('Health check failed, restarting server...');
      gracefulShutdown();
      server.listen(PORT, () => {
        console.log(`AI server restarted on http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.log('Health check failed, restarting server...');
    gracefulShutdown();
    server.listen(PORT, () => {
      console.log(`AI server restarted on http://localhost:${PORT}`);
    });
  }
};

// Set interval for health checks every 2 minutes
const healthCheckInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
setInterval(checkHealthAndRestart, healthCheckInterval);
          
