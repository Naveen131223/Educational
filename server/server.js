import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

let cache = {};

// Function to clear the cache
const clearCache = () => {
  cache = {};
  console.log('Cache cleared successfully');
};

// Clear cache every 10 minutes
const cacheClearInterval = 10 * 60 * 1000;
setInterval(clearCache, cacheClearInterval);

const sanitizeResponse = (response) => {
  let sanitized = response.replace("Here is the response:", "");
  return sanitized
    .replace(/[!@#*]/g, '')
    .replace(/(\.\.\.|…)*$/, '')
    .trim();
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

const getCachedResponse = (prompt) => {
  return cache[prompt] || null;
};

const cacheResponse = (prompt, response) => {
  cache[prompt] = response;
};

const loadModel = async () => {
  console.log('Initializing model...');
  try {
    await axios.post(OPENROUTER_API_URL, {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Initial model load' }
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    console.log('Model loaded successfully.');
  } catch (error) {
    console.error('Error loading model:', error?.response?.data || error.message);
  }
};

// Initial model load
loadModel();

app.get('/', (req, res) => {
  res.status(200).send({ message: 'Hi Sister' });
});

app.post('/', async (req, res) => {
  console.log('Received a POST request:', req.body);

  try {
    let { prompt } = req.body;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    if (prompt === 'Initialise model') {
      console.log('Warm-up message received: Initialise model');
      return res.status(200).send({ bot: 'Initialise model' });
    }

    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      console.log('Response retrieved from cache:', cachedResponse);
      return res.status(200).send({ bot: ` ${cachedResponse}` });
    }

    if (isGreeting(prompt)) {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      cacheResponse(prompt, randomResponse);
      return res.status(200).send({ bot: ` ${randomResponse}` });
    }

    if (isAskingForDate(prompt)) {
      const currentDate = getCurrentDate();
      cacheResponse(prompt, `The current date is: ${currentDate}`);
      return res.status(200).send({ bot: ` The current date is: ${currentDate}` });
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
      maxWords = adjustedPoints * 10;
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

    const maxTokens = Math.floor(Math.min((maxWords || 100) * 6, 2000));

    const apiResponse = await axios.post(OPENROUTER_API_URL, {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response from OpenRouter:', apiResponse.data);

    let botResponse = apiResponse.data?.choices?.[0]?.message?.content || 'No response generated';

    if (botResponse.toLowerCase().startsWith(prompt.toLowerCase())) {
      botResponse = botResponse.slice(prompt.length).trim();
    }

    if (subtopics && botResponse.includes(subtopics)) {
      botResponse = botResponse.replace(subtopics, '').trim();
    }

    const maxLength = maxWords ? maxWords * 6 : 2000;
    if (botResponse.length > maxLength) {
      const truncated = botResponse.slice(0, maxLength);
      const lastSentenceEnd = truncated.lastIndexOf('.');
      if (lastSentenceEnd > -1) {
        botResponse = truncated.slice(0, lastSentenceEnd + 1);
      } else {
        botResponse = truncated;
      }
    }

    const lastSentenceEnd = botResponse.lastIndexOf('.');
    if (lastSentenceEnd < botResponse.length - 1) {
      botResponse = botResponse.slice(0, lastSentenceEnd + 1);
    }

    const sanitizedResponse = sanitizeResponse(botResponse);

    cacheResponse(prompt, sanitizedResponse);

    res.status(200).send({ bot: ` ${sanitizedResponse}` });
  } catch (error) {
    console.error('Error communicating with OpenRouter API:', error?.response?.data || error.message);
    res.status(500).send({ error: 'Error processing the request' });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server is running on port http://localhost:${PORT}`)
);

const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
