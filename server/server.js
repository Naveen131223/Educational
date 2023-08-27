import express from 'express';
import cors from 'cors';
import axios from 'axios';

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
const prompt = req.body.prompt.text;
const apiKey = process.env.GOOGLE_API_KEY; // Access the environment variable
if (!apiKey) {
throw new Error('Google API key not found in environment variable');
}
const apiUrl = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;
const response = await axios.post(apiUrl, {
prompt: prompt,
max_tokens: 3000,
top_p: 1,
frequency_penalty: 0.5,
presence_penalty: 0
});
const botResponse = response.data.text;
res.status(200).send({
bot: botResponse
});
} catch (error) {
console.error(error);
res.status(500).send(error || 'Something went wrong');
}
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
