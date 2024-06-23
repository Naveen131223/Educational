import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/deepset/bert-large-uncased-whole-word-masking-finetuned-squad';
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
    const { context, question } = req.body;

    if (!context || !question) {
      return res.status(400).send({ error: 'Both context and question are required' });
    }

    const response = await axios.post(HF_API_URL, {
      inputs: {
        question: question,
        context: context
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    // Log the response for debugging
    console.log('Response from Hugging Face API:', response.data);

    // Extract the answer
    const botResponse = response.data.answer.trim();

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
