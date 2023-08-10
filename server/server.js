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
  // Here you can implement a logic to generate responses based on user input.
  // For demonstration purposes, using predefined responses.
  const responses = [
    "How can I assist you?",
    "Is there anything else you'd like to know?",
    "Feel free to ask any questions.",
    "I'm here to help. What can I do for you?",
  ];

  // Select a response randomly
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
