import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
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

    const response = await axios.post(HF_API_URL, {
      inputs: prompt,
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const botResponse = response.data.generated_text.trim();

    res.status(200).send({
      bot: botResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || 'Something went wrong');
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
