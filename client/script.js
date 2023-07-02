import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const messageContainer = chatContainer.querySelector('.message-container');

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
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);

      // After text generation, stop auto-scrolling
      chatContainer.removeEventListener('scroll', handleAutoScroll);
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

  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper', isAi ? 'ai' : '');

  const chat = document.createElement('div');
  chat.classList.add('chat');

  const profile = document.createElement('div');
  profile.classList.add('profile');

  const img = document.createElement('img');
  img.src = profileImg;
  img.alt = isAi ? 'bot' : 'user';

  const message = document.createElement('div');
  message.id = uniqueId;
  message.classList.add('message');
  message.textContent = value;

  profile.appendChild(img);
  chat.appendChild(profile);
  chat.appendChild(message);
  wrapper.appendChild(chat);

  return wrapper;
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
  const userChatStripe = createChatStripe(false, prompt);
  messageContainer.appendChild(userChatStripe);

  // Clear the textarea input
  form.reset();

  // Bot's chat stripe
  const uniqueId = generateUniqueId();
  const botChatStripe = createChatStripe(true, '', uniqueId);
  messageContainer.appendChild(botChatStripe);

  // Focus and scroll to the bottom of the chat container
  input.focus();
  messageContainer.lastElementChild.scrollIntoView({ behavior: 'smooth' });

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
    messageDiv.textContent = '';

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim(); // Trim any trailing spaces or '\n'

      // Display the bot's response with typing effect
      typeText(messageDiv, parsedData);
    } else {
      const err = await response.text();

      messageDiv.textContent = 'Something went wrong';
      alert(err);
    }
  } catch (error) {
    messageDiv.textContent = 'Something went wrong';
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

// Function to handle auto-scrolling
function handleAutoScroll() {
  const scrollOffset = 100; // Offset from the bottom of the container

  if (chatContainer.scrollTop + chatContainer.clientHeight + scrollOffset >= chatContainer.scrollHeight) {
    // User has scrolled to the bottom, so enable auto-scroll
    messageContainer.lastElementChild.scrollIntoView({ behavior: 'smooth' });
  }
}

// Attach event listener to scroll event for auto-scrolling
chatContainer.addEventListener('scroll', handleAutoScroll);

// Initialize auto-scroll on page load
messageContainer.lastElementChild.scrollIntoView({ behavior: 'smooth' });
