import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/blenderbot-3B';
const HF_API_KEY = process.env.HF_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!'
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    const response = await axios.post(HF_API_URL, {
      inputs: prompt,
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Response from Hugging Face API:', response.data);

    let botResponse;
    if (response.data.generated_text) {
      botResponse = response.data.generated_text.trim();
    } else if (response.data[0] && response.data[0].generated_text) {
      botResponse = response.data[0].generated_text.trim();
    } else {
      botResponse = 'No response generated';
    }

    // Adjust the response length based on the prompt length
    const promptLength = prompt.split(' ').length;
    let desiredWordCount;

    if (promptLength <= 10) {
      desiredWordCount = 30;
    } else if (promptLength <= 20) {
      desiredWordCount = 50;
    } else {
      desiredWordCount = 70;
    }

    // Trim or pad the bot response to fit the desired word count
    const words = botResponse.split(' ');
    if (words.length > desiredWordCount) {
      botResponse = words.slice(0, desiredWordCount).join(' ') + '...';
    } else if (words.length < desiredWordCount) {
      const additionalWords = new Array(desiredWordCount - words.length).fill('...');
      botResponse = botResponse + ' ' + additionalWords.join(' ');
    }

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
