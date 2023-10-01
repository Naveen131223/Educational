import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit request size to 1MB

app.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message; // Assuming the client sends a 'message' field

    // Fetch response from Google based on user's input
    const botResponse = await getGoogleResponse(userMessage);

    res.status(200).send({
      bot: botResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

async function getGoogleResponse(query) {
  try {
    // Make a request to Google
    const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

    // Extract the relevant information from the response (you may need to adjust this based on Google's HTML structure)
    const extractedInfo = 'Extracted information from Google response';

    return extractedInfo;
  } catch (error) {
    console.error('Error fetching data from Google:', error);
    return 'Failed to fetch information from Google';
  }
}

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
