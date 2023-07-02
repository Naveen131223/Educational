import bot from './assets/bot.svg';
import user from './assets/user.svg';

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
    // Simulate AI "thinking" with a shorter delay
    thinkingTimeout = setTimeout(async () => {
      // Fetch the response from the server
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

        // Display the bot's response instantly
        messageDiv.textContent = parsedData;
      } else {
        const err = await response.text();

        messageDiv.textContent = 'Something went wrong';
        alert(err);
      }
    }, 800); // Adjust the delay duration as needed
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
