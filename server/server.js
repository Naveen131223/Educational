import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit request size to 1MB

// Function to sanitize user input
function sanitizeInput(input) {
  const sanitizedInput = input.replace(/[^a-zA-Z0-9\s.,?!-]/g, '');
  return sanitizedInput;
}

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hi Sister',
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = sanitizeInput(req.body.prompt);

    // Perform the API call asynchronously using async/await
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0.2,
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
    res.status(500).send('Something went wrong');
  }
});

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
