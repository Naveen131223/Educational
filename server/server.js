import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple in-memory cache to store API responses
const responseCache = {};

// Middleware to check if the internet data is ready before processing requests
let isInternetDataReady = false; // Flag to check if the internet data is ready

// Simulate initialization of internet data asynchronously during server startup
const internetDataInitializationPromise = initializeInternetData();

async function initializeInternetData() {
  try {
    console.log('Initializing internet data...');
    // Example: Fetch data from the JSONPlaceholder API
    const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
    const internetData = response.data.title;

    responseCache['internetData'] = internetData;

    console.log('Internet data is ready!');
    isInternetDataReady = true;
  } catch (error) {
    console.error('Error initializing internet data:', error);
  }
}

// Middleware to check if the internet data is ready before processing requests
app.use((req, res, next) => {
  if (!isInternetDataReady) {
    return res.status(200).send({
      message: 'Initializing internet data, please wait...',
    });
  }
  next();
});

app.get('/status', (req, res) => {
  if (isInternetDataReady) {
    return res.status(200).send({
      status: 'Internet data is ready!',
    });
  }
  res.status(200).send({
    status: 'Internet data is initializing...',
  });
});

app.get('/', (req, res) => {
  // If the internet data is ready, return the cached response immediately
  return res.status(200).send({
    internetData: responseCache['internetData'],
  });
});

app.post('/', async (req, res) => {
  try {
    // Example: Using the fetched internet data in the response
    const botResponse = `Internet data: ${responseCache['internetData']}`;

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong');
});

// Start the server after the internet data is initialized
internetDataInitializationPromise.then(() => {
  const server = app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server has been closed.');
      process.exit(0);
    });
  });
});
