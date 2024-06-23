import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const HF_API_URL = 'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2'; // Updated model URL
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
    const question = req.body.question;
    const context = req.body.context;

    if (!question || !context) {
      return res.status(400).send({ error: 'Question and context are required' });
    }

    const response = await axios.post(HF_API_URL, {
      questions: [question],
      context: context
    }, {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    // Log the response for debugging
    console.log('Response from Hugging Face API:', response.data);

    // Extract the answer from the response
    let botResponse;
    if (response.data && response.data[0] && response.data[0].answers && response.data[0].answers.length > 0) {
      botResponse = response.data[0].answers[0].answer;
    } else {
      botResponse = 'No answer found';
    }

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error('Error fetching response from Hugging Face API:', error);
    res.status(500).send({ error: error.message || 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
    
