import express from 'express';
import puppeteer from 'puppeteer';

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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

  // Extract search results
  const searchResults = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('.tF2Cxc').forEach((result) => {
      results.push(result.textContent);
    });
    return results;
  });

  await browser.close();

  return searchResults;
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
