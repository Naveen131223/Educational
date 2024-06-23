import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
const HF_API_KEY = process.env.HF_API_KEY; // Your Hugging Face API token

// Endpoint to fetch response from Hugging Face DialoGPT
app.post('/fetch-from-dialoGPT', async (req, res) => {
  try {
    const userInput = req.body.message; // Assuming the client sends a 'message' field

    // Fetch response from Hugging Face DialoGPT
    const botResponse = await fetchDialoGPTResponse(userInput);

    res.status(200).json({
      bot: botResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Function to fetch response from Hugging Face DialoGPT
async function fetchDialoGPTResponse(userInput) {
  try {
    const response = await axios.post(HF_API_URL, {
      inputs: {
        text: userInput,
      },
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const botResponse = response.data.generated_text.trim();
    return botResponse;
  } catch (error) {
    console.error('Error fetching response from DialoGPT:', error);
    throw error;
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
