import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill'; // Updated model URL
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

    // Log the response for debugging
    console.log('Response from Hugging Face API:', response.data);

    // Extract the bot response, handling different possible formats
    let botResponse;
    if (response.data.generated_text) {
      botResponse = response.data.generated_text.trim();
    } else if (response.data[0] && response.data[0].generated_text) {
      botResponse = response.data[0].generated_text.trim();
    } else {
      botResponse = 'No response generated';
    }

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
                  
