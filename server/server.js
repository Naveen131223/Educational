import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).send({ error: 'Invalid or missing prompt in the request body.' });
    }

    // Launch a headless browser with puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Perform a search on Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
    await page.goto(searchUrl);

    // Extract all text content from the search results
    const results = await page.evaluate(() => {
      const extractedResults = [];
      document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span, a, li, td, span, strong, em, b, i, u, s').forEach((result) => {
        const text = result.textContent;
        const link = result.tagName === 'A' ? result.href : '';
        extractedResults.push({ text, link });
      });
      return extractedResults;
    });

    // Close the browser
    await browser.close();

    // Respond to the user
    res.status(200).send({
      bot: `Search results for "${prompt}" on Google: ${results.map(result => `${result.text} - ${result.link}`).join(', ')}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

const server = app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
});
