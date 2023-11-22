import express from 'express';
import https from 'https';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Simple in-memory cache to store search results
const searchResultsCache = {};

app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing query in the request body.' });
    }

    const sanitizedQuery = sanitizeInput(query);

    // Check if the result is already in the cache
    if (searchResultsCache[sanitizedQuery]) {
      return res.status(200).send({ results: searchResultsCache[sanitizedQuery] });
    }

    const searchResults = await performGoogleSearch(sanitizedQuery);

    // Cache the result for future use
    searchResultsCache[sanitizedQuery] = searchResults;

    res.status(200).send({ results: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

const performGoogleSearch = async (query) => {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return new Promise((resolve, reject) => {
    https.get(googleUrl, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        // Extract text content from HTML using a simple regular expression
        const textContents = extractTextFromHtml(data);
        resolve(textContents);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

const extractTextFromHtml = (html) => {
  // Use a regular expression to extract text content from HTML
  // This is a basic example and may not work reliably for all cases
  const textContentRegex = /<div class="tF2Cxc">(.*?)<\/div>/gs;
  const matches = html.match(textContentRegex) || [];
  
  // Remove HTML tags from each match
  const textContents = matches.map(match => match.replace(/<[^>]*>/g, ''));
  
  return textContents;
};

const sanitizeInput = (input) => {
  // Add input sanitation logic as needed
  // For simplicity, this example only trims the input
  return input.trim();
};

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
