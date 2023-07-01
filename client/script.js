import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const socket = new WebSocket('wss://your-websocket-server-url');

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

  const data = new FormData(form);
  const prompt = data.get('prompt');

  if (!prompt) {
    return;
  }

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
    // Send the user's message to the server via WebSocket
    socket.send(JSON.stringify({ prompt }));

    socket.addEventListener('message', (event) => {
      const response = JSON.parse(event.data);
      const parsedData = response.bot.trim(); // Trim any trailing spaces or '\n'

      clearInterval(loadInterval);
      messageDiv.innerHTML = '';

      // Display the bot's response with typing effect
      typeText(messageDiv, parsedData);

      // Scroll to the latest message
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  } catch (error) {
    messageDiv.innerHTML = 'Something went wrong';
    console.error(error);
  }
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
