import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

// Function to sanitize user input
const sanitizeUserInput = (input) => {
  const sanitizedInput = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return sanitizedInput;
};

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

app.use(limiter); // Apply rate limiting to all routes

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hi Sister',
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Sanitize user input before using it
    const sanitizedPrompt = sanitizeUserInput(prompt);

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${sanitizedPrompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    res.status(200).send({
      bot: response.data.choices[0].text,
    });
  } catch (error) {
    console.error(error); 
    res.status(500).send(error || 'Something went wrong');
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
