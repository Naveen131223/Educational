import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit request size to 1MB

app.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message; // Assuming the client sends a 'message' field

    // Generate a response based on the user's input
    const botResponse = generateBotResponse(userMessage);

    res.status(200).send({
      bot: botResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

function generateBotResponse(inputMessage) {
  const lowerCaseMessage = inputMessage.toLowerCase();

  if (lowerCaseMessage.includes('hi sister')) {
    return "Hi there! How can I help you?";
  } else if (lowerCaseMessage.includes('i am fine')) {
    return "I'm glad to know you're fine!";
  } else {
    // For any other messages, provide a generic response
    const genericResponses = [
      "How can I assist you?",
      "Is there anything else you'd like to know?",
      "Feel free to ask any questions.",
      "I'm here to help. What can I do for you?",
    ];

    // Select a response randomly
    const randomIndex = Math.floor(Math.random() * genericResponses.length);
    return genericResponses[randomIndex];
  }
}

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
