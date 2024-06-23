import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/bigscience/bloom'; // BLOOM model
const HF_API_KEY = process.env.HF_API_KEY; // Your Hugging Face API token

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

    // Extract the bot response
    const botResponse = response.data.choices[0].text.trim();

    // Add creativity: Randomly select from alternative completions
    const alternativeResponses = [
      'That\'s an interesting question!',
      'Let me think about that...',
      'Hmm, let me consult my digital crystal ball.',
    ];
    const randomIndex = Math.floor(Math.random() * alternativeResponses.length);
    const creativeResponse = alternativeResponses[randomIndex];

    res.status(200).send({ bot: `${creativeResponse} ${botResponse}` });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
