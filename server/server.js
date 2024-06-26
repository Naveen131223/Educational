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
  } catch (error) {
    console.error('Error checking model status:', error);
  }
};

// Check model status every minute
setInterval(checkModelLoaded, 60000);
checkModelLoaded();

const generateResponse = async (prompt, totalTokens) => {
  let fullResponse = '';
  let currentPrompt = prompt;
  let remainingTokens = totalTokens;

  while (remainingTokens > 0) {
    const response = await axios.post(HF_API_URL, {
      inputs: currentPrompt,
      parameters: {
        temperature: 0.7,
        max_new_tokens: Math.min(remainingTokens, 250), // using 250 tokens per request
        top_p: 1
      }
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    let generatedText;
    if (response.data.generated_text) {
      generatedText = response.data.generated_text.trim();
    } else if (response.data[0] && response.data[0].generated_text) {
      generatedText = response.data[0].generated_text.trim();
    } else {
      break; // stop if no response is generated
    }

    fullResponse += generatedText + ' ';
    currentPrompt = generatedText.split(' ').slice(-10).join(' '); // use the last 10 words as the new prompt

    remainingTokens -= 250;
  }

  return fullResponse.trim();
};

app.post('/', async (req, res) => {
  if (!modelLoaded) {
    return res.status(503).send({ error: 'Model is loading, please try again later' });
  }

  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }

    const botResponse = await generateResponse(prompt, 3000); // try to generate up to 3000 tokens

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);

    if (error.response) {
      res.status(error.response.status).send({ error: error.response.data });
    } else if (error.request) {
      res.status(500).send({ error: 'No response received from Hugging Face API' });
    } else {
      res.status(500).send({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
