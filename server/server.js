import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple in-memory Q&A data
const qaData = [
  { question: 'What is your name?', answer: 'I am a Q&A bot.' },
  { question: 'How does photosynthesis work?', answer: 'Photosynthesis is the process by which plants... ' },
  // Add more questions and answers as needed
];

// Middleware to handle user queries
app.post('/ask', (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing question in the request body.' });
    }

    const matchedQuestion = findMatchingQuestion(question);

    if (matchedQuestion) {
      return res.status(200).send({ answer: matchedQuestion.answer });
    } else {
      return res.status(200).send({ answer: 'I don\'t know the answer to that question.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

function findMatchingQuestion(userQuestion) {
  // Simple matching logic (you can use more advanced techniques if needed)
  for (const qaPair of qaData) {
    const similarity = calculateSimilarity(userQuestion, qaPair.question);
    if (similarity > 0.7) {
      return qaPair;
    }
  }
  return null;
}

function calculateSimilarity(str1, str2) {
  // Implement your similarity calculation logic (e.g., using Levenshtein distance)
  // This is a placeholder, and you may need a more sophisticated algorithm based on your requirements.
  return str1 === str2 ? 1 : 0;
}

// Start the server
const server = app.listen(port, () => {
  console.log(`Q&A server started on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
