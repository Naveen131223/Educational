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
  const lowercaseInput = inputMessage.toLowerCase(); // Convert input to lowercase
  
  if (lowercaseInput.includes('hello')) {
    return "Hello! How can I assist you?";
  } else if (lowercaseInput.includes('help')) {
    return "Of course, I'm here to help. What do you need assistance with?";
  } else if (lowercaseInput.includes('bye')) {
    return "Goodbye! Feel free to return if you have more questions.";
  } else {
    return "I'm here to assist you. Please let me know how I can help.";
  }
}

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
