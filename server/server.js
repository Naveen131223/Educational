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

// Clear cache every 10 mins
setInterval(() => {
  cache = {};
  console.log('Cache cleared.');
}, 10 * 60 * 1000);

// Utilities
const sanitizeResponse = (text) => {
  return text.replace("Here is the response:", "")
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
  const greetings = ['hi', 'hello', 'hey', 'hi bro', 'hi sister', 'hello there', 'hey there'];
  return greetings.includes(prompt.trim().toLowerCase());
};

const isAskingForDate = (prompt) => {
  return ['date', 'current date', "what date", "today's date", "current day"]
    .some(keyword => prompt.toLowerCase().includes(keyword));
};

const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

const mentionsDiagram = (prompt) => {
  return prompt.toLowerCase().includes('diagram');
};

// Marks category map
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

// Initial model warm-up
const loadModel = async () => {
  console.log('Warming up model...');
  try {
    await axios.post(HF_API_URL, {
      inputs: "Hello!",
    }, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    console.log('Model warmed up.');
  } catch (err) {
    console.error('Warm-up failed:', err.response?.data || err.message);
  }
};
loadModel();

app.get('/', (req, res) => {
  res.status(200).send({ message: 'Hi Sister' });
});

app.post('/', async (req, res) => {
  try {
    let { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    if (prompt === 'Initialise model') return res.status(200).send({ bot: 'Initialise model' });

    if (cache[prompt]) return res.status(200).send({ bot: ` ${cache[prompt]}` });

    if (isGreeting(prompt)) {
      const reply = responses[Math.floor(Math.random() * responses.length)];
      cache[prompt] = reply;
      return res.status(200).send({ bot: ` ${reply}` });
    }

    if (isAskingForDate(prompt)) {
      const date = getCurrentDate();
      const reply = `The current date is: ${date}`;
      cache[prompt] = reply;
      return res.status(200).send({ bot: ` ${reply}` });
    }

    const promptLower = prompt.toLowerCase();
    let maxWords = null;
    let subtopics = null;

    const markMatch = promptLower.match(/(\d+)\s*marks?/i);
    const wordMatch = promptLower.match(/(\d+)\s*words?/i);
    const pointsMatch = promptLower.match(/(\d+)\s*(points?|steps?)/i);

    if (markMatch) {
      const marks = parseInt(markMatch[1], 10);
      if (markCategories[marks]) {
        maxWords = markCategories[marks].words;
        subtopics = markCategories[marks].subtopics;
      }
    } else if (wordMatch) {
      maxWords = parseInt(wordMatch[1], 10);
    } else if (pointsMatch) {
      const points = parseInt(pointsMatch[1], 10);
      maxWords = (points + 3) * 10;
    }

    if (subtopics) {
      prompt += ` Please include: ${subtopics}.`;
    } else if (maxWords) {
      prompt += ` Please write within ${maxWords} words.`;
    } else {
      prompt += " Provide an accurate and informative answer.";
    }

    if (mentionsDiagram(prompt)) {
      prompt += " Include the diagram title in text.";
    }

    const maxNewTokens = Math.min(Math.floor((maxWords || 100) * 1.5), 2048);

    const response = await axios.post(HF_API_URL, {
      inputs: prompt,
      parameters: {
        temperature: 0.7,
        max_new_tokens: maxNewTokens,
        top_p: 0.9
      }
    }, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const data = Array.isArray(response.data) ? response.data[0] : response.data;
    let botResponse = data.generated_text || 'No response generated';

    if (botResponse.toLowerCase().startsWith(prompt.toLowerCase())) {
      botResponse = botResponse.slice(prompt.length).trim();
    }

    const maxLength = maxWords ? maxWords * 6 : 2048;
    if (botResponse.length > maxLength) {
      const trimmed = botResponse.slice(0, maxLength);
      const end = trimmed.lastIndexOf('.');
      botResponse = end !== -1 ? trimmed.slice(0, end + 1) : trimmed;
    }

    const sanitized = sanitizeResponse(botResponse);
    cache[prompt] = sanitized;
    res.status(200).send({ bot: ` ${sanitized}` });

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    res.status(500).send({ error: 'Error processing the request' });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Gracefully shutting down...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});
