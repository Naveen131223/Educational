import express from 'express'; // Import express for creating the server
import * as dotenv from 'dotenv'; // Import dotenv for environment variables
import cors from 'cors'; // Import cors for handling cross-origin requests
import axios from 'axios'; // Import axios for making HTTP requests

dotenv.config(); // Load environment variables from .env file

// Hugging Face API URL and API Key from environment variables
const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct';
const HF_API_KEY = process.env.HF_API_KEY;

const app = express(); // Create an express application
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

let cache = {}; // Initialize an empty cache

// Function to clear the cache
const clearCache = () => {
  cache = {};
  console.log('Cache cleared successfully');
};

// Function to clear the module cache
const clearModuleCache = () => {
  console.log('Clearing module cache...');
  for (const key in import.meta.url) {
    if (import.meta.url.hasOwnProperty(key)) {
      delete import.meta.url[key];
    }
  }
  console.log('Module cache cleared successfully');
};

// Set intervals to clear cache and module cache
const cacheClearInterval = 7 * 60 * 1000; // 7 minutes in milliseconds
setInterval(clearCache, cacheClearInterval);

const moduleCacheClearInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
setInterval(clearModuleCache, moduleCacheClearInterval);

// Function to sanitize response by removing unwanted characters
const sanitizeResponse = (response) => {
  // Remove unwanted phrases like "Here is the response:"
  let sanitized = response.replace("Here is the response:", "");

  // Remove unwanted symbols and trim the result
  return sanitized
    .replace(/[!@#*]/g, '') // Remove symbols such as !, @, #, *
    .replace(/(\.\.\.|…)*$/, '') // Remove trailing ellipses or other unwanted characters
    .trim(); // Remove leading and trailing whitespace
};

// Predefined responses for greetings
const responses = [
  "How can I assist you?",
  "How can I help you?",
  "Is there anything else you'd like to know?",
  "Feel free to ask any questions.",
  "I'm here to help. What can I do for you?",
];

// Function to check if the prompt is a greeting
const isGreeting = (prompt) => {
  const greetings = [
    'hi', 'hello', 'hey', 'hi bro', 'hi sister', 'hello there', 'hey there'
  ];
  const normalizedPrompt = prompt.trim().toLowerCase();
  return greetings.includes(normalizedPrompt);
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

// Function to retrieve cached response or null if not cached
const getCachedResponse = (prompt) => {
  return cache[prompt] || null;
};

// Function to cache response
const cacheResponse = (prompt, response) => {
  cache[prompt] = response;
};

// Main route for handling POST requests
app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    // Check if response is cached
    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      console.log('Response retrieved from cache:', cachedResponse);
      return res.status(200).send({ bot: ' ' + cachedResponse });
    }

    // Handle greetings
    if (isGreeting(prompt)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      cacheResponse(prompt, randomResponse);
      return res.status(200).send({ bot: ' ' + randomResponse });
    }

    // Handle requests for the current date
    if (isAskingForDate(prompt)) {
      const currentDate = getCurrentDate();
      cacheResponse(prompt, 'The current date is: ' + currentDate);
      return res.status(200).send({ bot: ' The current date is: ' + currentDate });
    }

    // Process prompt for word count and subtopics
    const promptLowerCase = prompt.toLowerCase();
    let maxWords = null;
    let subtopics = null;

    // Extract marks, word counts, or points from the prompt
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

    // Request to Hugging Face API
    axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.7, // Increased temperature for more creative responses
        max_new_tokens: maxNewTokens, // Ensure this is an integer
        top_p: 0.9 // Nucleus sampling, adjusted to be within the valid range
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
      console.error('Error with Hugging Face API:', error.message);
      res.status(500).send({
        error: 'Error fetching response from Hugging Face API',
      });
    });
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).send({ error: 'Error processing request' });
  }
});

// Route for health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Function to start the server
const startServer = () => {
  try {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error.message);
  }
};

// Start the server
startServer();

// Graceful shutdown function
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
      startServer();
    }
  } catch (error) {
    console.log('Health check failed, restarting server...');
    gracefulShutdown();
    startServer();
  }
};

// Set interval for health checks
setInterval(checkHealthAndRestart, 5 * 60 * 1000); // Every 5 minutes
                  
