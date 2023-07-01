import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;
let autoScrollEnabled = true;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
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

const handleSubmit = async (e) => {
  e.preventDefault();

  const input = form.querySelector('textarea');
  const prompt = input.value.trim();

  if (prompt === '') {
    // Do not submit if the prompt is empty
    return;
  }

  // Disable the submit button while processing
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  // User's chat stripe
  chatContainer.innerHTML += createChatStripe(false, prompt);

  // Clear the textarea input
  form.reset();

  // Bot's chat stripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += createChatStripe(true, '', uniqueId);

  // Focus and scroll to the bottom of the chat container
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Get the message div
  const messageDiv = document.getElementById(uniqueId);

  // Show the loading indicator
  loader(messageDiv);

  try {
    const response = await fetch('https://educational-development.onrender.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim(); // Trim any trailing spaces or '\n'

      // Display the bot's response with typing effect
      typeText(messageDiv, parsedData);
    } else {
      const err = await response.text();

      messageDiv.innerHTML = 'Something went wrong';
      alert(err);
    }
  } catch (error) {
    messageDiv.innerHTML = 'Something went wrong';
    console.error(error);
  } finally {
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

// Auto-scroll to the latest message
function scrollToLatestMessage() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Variable to track whether auto-scroll is enabled

// Function to handle manual scrolling
function handleScroll() {
  const scrollOffset = 100; // Offset from the bottom of the container

  if (chatContainer.scrollTop + chatContainer.clientHeight + scrollOffset >= chatContainer.scrollHeight) {
    // User has scrolled to the bottom, so enable auto-scroll
    autoScrollEnabled = true;
  } else {
    // User has manually scrolled up, so disable auto-scroll
    autoScrollEnabled = false;
  }
}

// Attach event listener to scroll event for manual scrolling
chatContainer.addEventListener('scroll', handleScroll);

// Attach event listener to scroll event
chatContainer.addEventListener('scroll', () => {
  if (autoScrollEnabled) {
    scrollToLatestMessage();
  }
});

// Initialize auto-scroll on page load
scrollToLatestMessage();
