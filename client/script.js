import bot from './assets/bot.svg';
import user from './assets/user.svg';
const puppeteer = require('puppeteer');

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const input = form.querySelector('textarea');
const submitButton = form.querySelector('button[type="submit"]');

let loadInterval;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 100);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function createChatStripe(isAi, value, uniqueId) {
  const profileImg = isAi ? bot : user;

  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
      <div class="chat">
        <div class="profile">
          <img src="${profileImg}" alt="${isAi ? 'bot' : 'user'}" />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
  `;
}

let thinkingTimeout;

const handleSubmit = async (e) => {
  e.preventDefault();

  const prompt = input.value.trim();

  if (prompt === '') {
    // Do not submit if the prompt is empty
    return;
  }

  // Disable the submit button while processing
  submitButton.disabled = true;

  // User's chat stripe
  const userChatStripe = createChatStripe(false, prompt);
  chatContainer.insertAdjacentHTML('beforeend', userChatStripe);

  // Clear the textarea input
  form.reset();

  // Bot's chat stripe
  const uniqueId = generateUniqueId();
  const botChatStripe = createChatStripe(true, '', uniqueId);
  chatContainer.insertAdjacentHTML('beforeend', botChatStripe);

  // Get the message div
  const messageDiv = document.getElementById(uniqueId);

  // Show the loading indicator
  loader(messageDiv);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the search page
    await page.goto('https://search.brave.com');

    // Type the search query in the search input field
    await page.type('#search_form_input_homepage', prompt);

    // Submit the search form
    await page.keyboard.press('Enter');

    // Wait for the search results to load
    await page.waitForSelector('#links .result');

    // Extract the search results
    const searchResults = await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('#links .result'));
      const searchResultData = results.map((result) => {
        const title = result.querySelector('h2').textContent;
        const link = result.querySelector('a').href;
        const description = result.querySelector('p').textContent;

        return {
          title,
          link,
          description,
        };
      });

      return searchResultData;
    });

    // Close the browser
    await browser.close();

    if (searchResults.length > 0) {
      // Display the search results
      searchResults.forEach((result) => {
        const resultText = `${result.title}\n${result.link}\n${result.description}`;
        const resultChatStripe = createChatStripe(true, resultText);
        chatContainer.insertAdjacentHTML('beforeend', resultChatStripe);
      });
    } else {
      // If no results were found, display a message
      const noResultsMessage = 'No results found';
      const noResultsChatStripe = createChatStripe(true, noResultsMessage);
      chatContainer.insertAdjacentHTML('beforeend', noResultsChatStripe);
    }

    clearInterval(loadInterval);
    messageDiv.textContent = '';

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  } catch (error) {
    messageDiv.textContent = 'Something went wrong';
    console.error(error);

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  }
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});

// Auto-scroll to the latest message smoothly
function scrollToLatestMessage() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth',
  });
}

// Scroll to the latest message on initial load
window.addEventListener('load', () => {
  scrollToLatestMessage();
});
