import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import readlineSync from 'readline-sync';

const app = express();
app.use(cors());
app.use(express.json());

// Ask the user for the OpenAI API key
const apiKey = askUserForApiKey();

let openai;
if (apiKey) {
  const configuration = new Configuration({
    apiKey,
  });
  openai = new OpenAIApi(configuration);
}

const constantResponses = [
  "How can I assist you?",
  "How can I help you?",
  "Is there anything else you'd like to know?",
  "Feel free to ask any questions.",
  "I'm here to help. What can I do for you?",
];

app.get('/', (req, res) => {
  const randomIndex = Math.floor(Math.random() * constantResponses.length);
  const defaultMessage = constantResponses[randomIndex];

  res.status(200).send({
    message: 'Hello from CodeX!',
    defaultResponse: defaultMessage,
  });
});

app.post('/', async (req, res) => {
  try {
    if (!openai) {
      const randomIndex = Math.floor(Math.random() * constantResponses.length);
      const defaultMessage = constantResponses[randomIndex];
      return res.status(200).send({
        bot: defaultMessage,
      });
    }

    const prompt = req.body.prompt;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    res.status(200).send({
      bot: response.data.choices[0].text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));

function askUserForApiKey() {
  const apiKey = readlineSync.question('Enter your OpenAI API key: ');
  return apiKey || null; // return null if the user didn't provide the API key
}
