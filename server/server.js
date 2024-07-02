import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct';
const HF_API_KEY = process.env.HF_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

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

// Check model status every 6 hours
const checkInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
setInterval(checkModelLoaded, checkInterval);
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
  5: { words: 150 },
  6: { words: 190 },
  7: { words: 240, subtopics: 'detailed explanation, multiple examples, and analysis' },
  8: { words: 290, subtopics: 'multiple subtopics, examples, explanations, and analysis' },
  10: { words: 530, subtopics: 'detailed exploration, several subtopics, introduction, main content, and conclusion' },
  12: { words: 630, subtopics: 'comprehensive coverage, numerous subtopics, in-depth analysis, examples, and conclusion' },
  15: { words: 680, subtopics: 'extensive subtopics, background information, detailed explanations, case studies, critical analysis, and strong conclusion' },
  20: { words: 880, subtopics: 'thorough coverage, extensive subtopics, historical context, detailed arguments, multiple perspectives, in-depth analysis, case studies, and comprehensive conclusion' }
};

const isAskingForDateTime = (prompt) => {
  const dateTimeKeywords = [
    'date', 'time', 'current time', 'current date', 'what time', 'what date', 'today\'s date', 'current day'
  ];
  const normalizedPrompt = prompt.trim().toLowerCase();
  return dateTimeKeywords.some(keyword => normalizedPrompt.includes(keyword));
};

const getCurrentDateTime = () => {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: true 
  };
  return now.toLocaleString('en-US', options);
};

const mentionsDiagram = (prompt) => {
  return prompt.toLowerCase().includes('diagram');
};

const isAskingForNews = (prompt) => {
  const newsKeywords = [
    'news', 'headlines', 'latest news', 'current news'
  ];
  const normalizedPrompt = prompt.trim().toLowerCase();
  return newsKeywords.some(keyword => normalizedPrompt.includes(keyword));
};

const fetchNews = async () => {
  const countries = [
    'ae', 'ar', 'at', 'au', 'be', 'bg', 'br', 'ca', 'ch', 'cn', 'co', 'cu', 
    'cz', 'de', 'eg', 'fr', 'gb', 'gr', 'hk', 'hu', 'id', 'ie', 'il', 'in', 
    'it', 'jp', 'kr', 'lt', 'lv', 'ma', 'mx', 'my', 'ng', 'nl', 'no', 'nz', 
    'ph', 'pl', 'pt', 'ro', 'rs', 'ru', 'sa', 'se', 'sg', 'si', 'sk', 'th', 
    'tr', 'tw', 'ua', 'us', 've', 'za'
  ];

  let newsArticles = [];

  try {
    for (const country of countries) {
      const response = await axios.get(NEWS_API_URL, {
        params: {
          apiKey: NEWS_API_KEY,
          country: country,
          pageSize: 1 // Fetch one top article per country to avoid rate limits
        }
      });

      if (response.data && response.data.articles) {
        const articles = response.data.articles;
        articles.forEach(article => {
          newsArticles.push(`${article.title} - ${article.description}`);
        });
      }
    }
    
    if (newsArticles.length === 0) {
      return 'No news available at the moment.';
    }

    return newsArticles.join('\n');
  } catch (error) {
    console.error('Error fetching news:', error);
    return 'Failed to fetch news.';
  }
};

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hi Sister'
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

    if (isAskingForDateTime(prompt)) {
      const currentDateTime = getCurrentDateTime();
      return res.status(200).send({ bot: `The current date and time is: ${currentDateTime}` });
    }

    if (isAskingForNews(prompt)) {
      const news = await fetchNews();
      return res.status(200).send({ bot: news });
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
      prompt += ` Please provide the answer in ${maxWords} words.`;
    } else {
      prompt += " Provide an accurate answer.";
    }

    if (mentionsDiagram(prompt)) {
      prompt += " Include a title name with the diagram.";
    }

    const maxNewTokens = Math.floor(Math.min((maxWords || 100) * 1.5, 1600)); // Ensure integer value

    const response = await axios.post(HF_API_URL, {
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

    // Remove the subtopics prompt from the response if present
    if (subtopics && botResponse.includes(subtopics)) {
      botResponse = botResponse.replace(`Please cover the following subtopics: ${subtopics}.`, '').trim();
    }

    res.status(200).send({ bot: sanitizeResponse(botResponse) });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({ error: 'Failed to process request' });
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
        
