import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const input = form.querySelector('textarea');
const submitButton = form.querySelector('button[type="submit"]');
const printButton = document.createElement('button');
const continueReadingButton = document.createElement('button');
let loadInterval;
const userChats = [];
const botChats = [];
let currentUtteranceIndex = -1; // Variable to keep track of the current message being read
let isReading = false;
let isFetching = false;

// CSS styles for the buttons
printButton.style.cssText = `
  background-color: #007bff;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
`;

continueReadingButton.style.cssText = `
  background-color: #28a745;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
  margin-left: 10px;
`;

printButton.textContent = 'Read AI Output';
continueReadingButton.textContent = 'Continue Reading';

// Function to toggle reading the AI output
function toggleReading(message, index) {
  if (isReading && currentUtteranceIndex === index) {
    // Stop reading if currently reading the same message
    window.speechSynthesis.cancel();
    isReading = false;
    printButton.textContent = 'Read AI Output';
  } else {
    // Start reading the AI output
    if (currentUtteranceIndex !== index) {
      // Create a new utterance for the new message
      const utterance = new SpeechSynthesisUtterance(message);
      currentUtteranceIndex = index;
      utterance.voiceURI = 'Google US English';
      utterance.lang = 'en-IN-ta';
      utterance.volume = 1;
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      utterance.onend = () => {
        isReading = false;
        printButton.textContent = 'Read AI Output';

        // Check if there is a next message to continue reading
        const nextIndex = currentUtteranceIndex + 1;
        const nextBotChat = botChats[nextIndex];
        if (nextBotChat) {
          toggleReading(nextBotChat.value, nextIndex);
        }
      };
      window.speechSynthesis.speak(utterance);
      isReading = true;
      printButton.textContent = 'Stop Reading';
    }
  }
}

printButton.addEventListener('click', () => {
  const lastBotChat = botChats[botChats.length - 1];
  if (lastBotChat) {
    toggleReading(lastBotChat.value, botChats.length - 1);
  }
});
chatContainer.appendChild(printButton);

continueReadingButton.addEventListener('click', () => {
  const lastBotChat = botChats[currentUtteranceIndex];
  if (lastBotChat) {
    toggleReading(lastBotChat.value, currentUtteranceIndex);
  }
});
chatContainer.appendChild(continueReadingButton);

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
  const hexadecimalString = randomNumber.toString(16).slice(2, 8); // Generate a 6-digit hexadecimal string

  return `id-${timestamp}-${hexadecimalString}`;
}

function createChatStripe(isAi, value, uniqueId) {
  const profileImg = isAi ? bot : user;
  const message = { isAi, value };

  if (isAi) {
    botChats.push(message);
  } else {
    userChats.push(message);
  }

  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
      <div class="chat">
        <div class="profile">
          <img src="${profileImg}" alt="${isAi ? 'bot' : 'user'}" />
        </div>
        <div class="message" id="${uniqueId}">
          <span>${value}</span>
        </div>
      </div>
    </div>
  `;
}

let thinkingTimeout;

async function fetchResponse(prompt) {
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

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim(); // Trim any trailing spaces or '\n'
      return parsedData;
    } else {
      throw new Error('Failed to fetch response from the server');
    }
  } catch (error) {
    console.error('Error fetching response:', error);
    throw error;
  }
}

const handleResponse = async (prompt) => {
  try {
    isFetching = true;

    // Fetch the response from the server
    const parsedData = await fetchResponse(prompt);

    // Bot's chat stripe
    const uniqueId = generateUniqueId();
    const botChatStripe = createChatStripe(true, parsedData, uniqueId);
    chatContainer.insertAdjacentHTML('beforeend', botChatStripe);

    // Get the message div
    const messageDiv = document.getElementById(uniqueId);

    // Clear the loading indicator
    clearInterval(loadInterval);
    messageDiv.textContent = '';

    // Display the bot's response instantly
    messageDiv.innerHTML = `
      <span>${parsedData}</span>
    `;

    // Scroll to the latest message after rendering the response
    scrollToLatestMessage();

    // Re-enable the submit button after processing
    submitButton.disabled = false;

    // Focus on the input field for the next response
    input.focus();

    // Start reading the AI output
    toggleReading(parsedData, botChats.length - 1);

    // Check if there is a next user input message
    const nextIndex = userChats.length;
    const nextUserChat = userChats[nextIndex];
    if (nextUserChat) {
      // Simulate typing delay before showing the user input message
      await simulateTypingDelay();
      handleUserInput(nextUserChat.value);
    }
  } catch (error) {
    console.error('Error handling response:', error);

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  } finally {
    isFetching = false;
  }
};

const simulateTypingDelay = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 500); // Adjust the typing delay duration as needed
  });
};

const handleUserInput = (prompt) => {
  // User's chat stripe
  const userChatStripe = createChatStripe(false, prompt);
  chatContainer.insertAdjacentHTML('beforeend', userChatStripe);

  // Clear the textarea input
  form.reset();

  // Scroll to the latest message after inserting the user's chat stripe
  scrollToLatestMessage();

  // Start fetching the AI response
  if (!isFetching) {
    // Show the loading indicator
    const uniqueId = generateUniqueId();
    const botChatStripe = createChatStripe(true, '', uniqueId);
    chatContainer.insertAdjacentHTML('beforeend', botChatStripe);

    // Get the message div
    const messageDiv = document.getElementById(uniqueId);

    // Show the loading indicator
    loader(messageDiv);

    // Simulate AI "thinking" with a shorter delay
    thinkingTimeout = setTimeout(() => {
      handleResponse(prompt);
    }, 500); // Adjust the AI delay duration as needed
  }
};

const handleSubmit = (e) => {
  e.preventDefault();

  const prompt = input.value.trim();

  if (prompt === '') {
    // Do not submit if the prompt is empty
    return;
  }

  // Disable the submit button while processing
  submitButton.disabled = true;

  handleUserInput(prompt);
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
