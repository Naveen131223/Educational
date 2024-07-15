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
let utterance;
let currentUtteranceIndex = -1; // Variable to keep track of the current message being read
let isReading = false;

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
      utterance = new SpeechSynthesisUtterance(message);
      currentUtteranceIndex = index;
      utterance.voiceURI = 'Google US English';
      utterance.lang = 'en-IN-ta';
      utterance.volume = 2;
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
    }
    window.speechSynthesis.speak(utterance);
    isReading = true;
    printButton.textContent = 'Stop Reading';
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

const handleSubmit = function(e) {
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

  // Scroll to the latest message after inserting the user's chat stripe
  scrollToLatestMessage();

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
    thinkingTimeout = setTimeout(function() {
      try {
        // Fetch the response from the server using XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://educational-development.onrender.com/', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            clearInterval(loadInterval);
            messageDiv.textContent = '';

            if (xhr.status === 200) {
              const data = JSON.parse(xhr.responseText);
              const parsedData = data.bot.trim(); // Trim any trailing spaces or '\n'

              // Display the bot's response instantly
              messageDiv.innerHTML = `<span>${parsedData}</span>`;

              // Scroll to the latest message after rendering the response
              scrollToLatestMessage();

              // Re-enable the submit button after processing
              submitButton.disabled = false;

              // Focus on the input field for the next response
              input.focus();

              // Listen for user feedback on the response
              listenForFeedback(prompt, parsedData);

              // Start reading the AI output
              toggleReading(parsedData, botChats.length - 1);
            } else {
              const err = xhr.responseText;

              messageDiv.textContent = 'Something went wrong';
              alert(err);

              // Re-enable the submit button after processing
              submitButton.disabled = false;
            }
          }
        };

        xhr.send(JSON.stringify({ prompt: prompt }));
      } catch (error) {
        messageDiv.textContent = 'Something went wrong';
        console.error(error);

        // Re-enable the submit button after processing
        submitButton.disabled = false;
      }
    }, 100); // Adjust the AI delay duration as needed
  } catch (error) {
    messageDiv.textContent = 'Something went wrong';
    console.error(error);

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  }
};

// Function to listen for user feedback on the AI response
const listenForFeedback = function(prompt, botResponse) {
  const feedbackForm = document.createElement('form');
  const feedbackInput = document.createElement('input');
  const feedbackSubmitButton = document.createElement('button');
  const feedbackCancelButton = document.createElement('button');

  feedbackForm.classList.add('feedback-form');
  feedbackInput.setAttribute('type', 'text');
  feedbackInput.setAttribute('placeholder', 'Provide feedback');
  feedbackSubmitButton.setAttribute('type', 'submit');
  feedbackSubmitButton.textContent = 'Submit';
  feedbackCancelButton.setAttribute('type', 'button');
  feedbackCancelButton.textContent = 'Cancel';

  feedbackForm.appendChild(feedbackInput);
  feedbackForm.appendChild(feedbackSubmitButton);
  feedbackForm.appendChild(feedbackCancelButton);

  const feedbackContainer = document.createElement('div');
  feedbackContainer.classList.add('feedback-container');
  feedbackContainer.appendChild(feedbackForm);

  chatContainer.appendChild(feedbackContainer);

  feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const feedback = feedbackInput.value.trim();

    if (feedback === '') {
      return;
    }

    // Send the feedback to the server for model improvement
    sendFeedback(prompt, botResponse, feedback);

    // Remove the feedback form from the chat
    chatContainer.removeChild(feedbackContainer);
  });

  feedbackCancelButton.addEventListener('click', function() {
    // Remove the feedback form from the chat
    chatContainer.removeChild(feedbackContainer);
  });
};

// Function to send feedback to the server for model improvement
const sendFeedback = function(prompt, botResponse, feedback) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://educational-development.onrender.com/feedback', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status !== 200) {
        console.error('Failed to send feedback:', xhr.status, xhr.statusText);
      }
    };

    xhr.send(JSON.stringify({
      prompt: prompt,
      botResponse: botResponse,
      feedback: feedback,
    }));
  } catch (error) {
    console.error('Error sending feedback:', error);
  }
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', function(e) {
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
window.addEventListener('load', function() {
  scrollToLatestMessage();
});

const printButtonContainer = document.getElementById('printButtonContainer');
const continueReadingButtonContainer = document.getElementById('continueReadingButtonContainer');

printButtonContainer.appendChild(printButton);
continueReadingButtonContainer.appendChild(continueReadingButton);
