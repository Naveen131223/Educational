import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit request size to 1MB

app.post('/', async (req, res) => {
  try {
    // You can simply send a fixed response here
    res.status(200).send({
      bot: "How can I help you?",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

const PORT = 5000;

app.listen(PORT, () => console.log(`AI server started on http://localhost:${PORT}`));
