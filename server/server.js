import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import cheerio from 'cheerio';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to fetch response from ChatGPT.com
app.post('/fetch-from-chatgpt', async (req, res) => {
  try {
    const userInput = req.body.message; // Assuming the client sends a 'message' field

    // Fetch response from ChatGPT.com
    const botResponse = await fetchChatGPTResponse(userInput);

    res.status(200).json({
      bot: botResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Function to fetch response from ChatGPT.com
async function fetchChatGPTResponse(userInput) {
  try {
    // Adjust the URL to the correct endpoint where the message can be posted
    const response = await axios.post('https://chatgpt.com/', {
      message: userInput,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract the bot response from the HTML (adjust based on the actual structure)
    const botResponse = $('.response').text().trim(); // Example assuming a class "response"

    return botResponse;
  } catch (error) {
    console.error('Error fetching response from ChatGPT.com:', error);
    throw error;
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
