import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import cluster from 'cluster';
import os from 'os';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const app = express();
  
  // Set up CORS configuration
  const allowedOrigins = ['https://example.com', 'https://yourdomain.com'];
  app.use(cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }));
  
  app.use(express.json());

  app.get('/', async (req, res) => {
    res.status(200).send({
      message: 'Hello from CodeX!',
    });
  });

  app.post('/', async (req, res) => {
    try {
      // Validate and sanitize input
      const prompt = req.body.prompt;

      // Implement rate limiting here
      
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
      res.status(500).send('Something went wrong');
    }
  });

  app.listen(5000, () => console.log(`AI server started on http://localhost:5000 (Worker ${process.pid})`));
}
