import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit request size to 1MB

const userResponses = {}; // Store user responses for manual response manner

app.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message.toLowerCase(); // Convert message to lowercase for case-insensitive check

    // Store the user's message in the responses object
    userResponses[new Date().toISOString()] = userMessage;

    let manualResponse = "Hello, how can I assist you?"; // Default response

    // Check user's message for trigger phrases
    if (userMessage.includes('hi sister')) {
      manualResponse = "Hi there! How can I help you?";
    } else if (userMessage.includes('how are you')) {
      manualResponse = "I'm just a bot, but I'm here to assist you!";
    } else if (userMessage.includes('tell me a joke')) {
      manualResponse = "Sure! Why don't scientists trust atoms? Because they make up everything!";
    }
    // Add more trigger phrases and responses here

    res.status(200).send({
      bot: manualResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Endpoint to get user responses
app.get('/user-responses', (req, res) => {
  res.status(200).send(userResponses);
});

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
