import express from 'express';
import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import NodeCache from 'node-cache';
import WebSocket from 'ws'; // Import WebSocket library

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
const cache = new NodeCache({ stdTTL: 60 }); // Cache responses for 60 seconds
const clients = new Set(); // Store WebSocket clients

// Enable gzip compression
app.use(compression());

// Set up Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"], // Add any trusted script sources here
    },
  })
);

// Set up other secure headers
app.use(
  helmet({
    contentSecurityPolicy: false, // We've set CSP manually above
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
    },
  })
);

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// Websocket endpoint for clients to connect
const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Function to send response to all connected clients
const sendResponseToClients = (prompt, botResponse) => {
  const payload = { prompt, botResponse };
  const serializedPayload = JSON.stringify(payload);

  for (const client of clients) {
    client.send(serializedPayload);
  }
};

// Validate user input
app.post(
  '/',
  body('prompt').notEmpty().withMessage('Prompt must not be empty'),
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prompt = req.body.prompt;

    // Check if the response is cached
    const cachedResponse = cache.get(prompt);
    if (cachedResponse) {
      return res.status(200).send(cachedResponse);
    }

    try {
      // Your existing code to interact with OpenAI API...
      const botResponse = await openai.someFunction(prompt);

      // Cache the response
      cache.set(prompt, { bot: botResponse });

      // Send the response to all connected clients (real-time update)
      sendResponseToClients(prompt, botResponse);

      res.status(200).send({
        bot: botResponse,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Something went wrong');
    }
  }
);

// Create HTTP server
const server = app.listen(5000, () => console.log('AI server started on http://localhost:5000'));

// Upgrade HTTP server to WebSocket server
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
