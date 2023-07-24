import express from 'express';
import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();

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

    try {
      const prompt = req.body.prompt;

      // Your existing code to interact with OpenAI API...

      res.status(200).send({
        bot: botResponse,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Something went wrong');
    }
  }
);

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
