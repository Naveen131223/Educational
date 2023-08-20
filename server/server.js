import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/', async (req, res) => {
  try {
    const userMessage = req.body.message;

    const botResponse = await generateBotResponse(userMessage);

    res.status(200).send({
      bot: botResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

async function generateBotResponse(inputMessage) {
  // Normalize user input for case-insensitive comparison
  const normalizedInput = inputMessage.toLowerCase();

  // Check for specific input messages and provide corresponding responses
  if (normalizedInput.includes('hi sister')) {
    return "How can I help you?";
  } else if (normalizedInput.includes('hello')) {
    return "Hello! How can I assist you?";
  } else if (normalizedInput.includes('bye')) {
    return "Goodbye! Feel free to ask more questions later.";
  } else {
    return "I'm here to help. What can I do for you?";
  }
}

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
