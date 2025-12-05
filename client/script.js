import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const input = form.querySelector('textarea');
const submitButton = form.querySelector('button[type="submit"]');

const printButton = document.createElement('button');
const continueReadingButton = document.createElement('button');
const muteButton = document.createElement('button');

let loadInterval;
const userChats = [];
const botChats = [];
let utterance;
let currentUtteranceIndex = -1; // which bot message is being read
let isReading = false;
let isMuted = false; // ✅ mute state

/* ================= BUTTON STYLES ================= */

printButton.style.cssText = `
  background-color: #007bff;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
`;
printButton.textContent = 'Read AI Output';

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
continueReadingButton.textContent = 'Continue Reading';

muteButton.style.cssText = `
  background-color: #dc3545;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
  margin-left: 10px;
`;
muteButton.textContent = 'Mute Voice';

/* ================= SPEECH FUNCTION (FIXED) ================= */

function toggleReading(message, index) {
  // Always prepare utterance for this index (even if muted)
  if (currentUtteranceIndex !== index || !utterance) {
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

      // Auto-continue to next bot message if it exists and has value
      const nextIndex = currentUtteranceIndex + 1;
      const nextBotChat = botChats[nextIndex];
      if (nextBotChat && nextBotChat.value) {
        toggleReading(nextBotChat.value, nextIndex);
      }
    };
  }

  // If muted → do not speak, but keep utterance ready
  if (isMuted) {
    isReading = false;
    printButton.textContent = 'Read AI Output';
    return;
  }

  // Normal toggle: stop or start
  if (isReading) {
    window.speechSynthesis.cancel();
    isReading = false;
    printButton.textContent = 'Read AI Output';
  } else {
    window.speechSynthesis.speak(utterance);
    isReading = true;
    printButton.textContent = 'Stop Reading';
  }
}

/* ================= BUTTON EVENTS ================= */

printButton.addEventListener('click', () => {
  const lastBotChat = botChats[botChats.length - 1];
  if (lastBotChat && lastBotChat.value) {
    toggleReading(lastBotChat.value, botChats.length - 1);
  }
});

continueReadingButton.addEventListener('click', () => {
  const lastBotChat = botChats[currentUtteranceIndex];
  if (lastBotChat && lastBotChat.value) {
    toggleReading(lastBotChat.value, currentUtteranceIndex);
  }
});

// Mute / Unmute with state reset
muteButton.addEventListener('click', () => {
  if (!isMuted) {
    window.speechSynthesis.cancel();
    isMuted = true;
    isReading = false;
    muteButton.textContent = 'Unmute Voice';
    muteButton.style.backgroundColor = '#ffc107'; // yellow
    muteButton.style.color = '#000';
    printButton.textContent = 'Read AI Output';
  } else {
    isMuted = false;
    muteButton.textContent = 'Mute Voice';
    muteButton.style.backgroundColor = '#dc3545'; // red
    muteButton.style.color = '#fff';
  }
});

/* ================= LOADER ================= */

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 100);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16).slice(2, 8);

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

/* ================= HANDLE SUBMIT (FULL RESPONSE FIX) ================= */

const handleSubmit = function(e) {
  e.preventDefault();

  const prompt = input.value.trim();
  if (prompt === '') return;

  // Disable the submit button while processing
  submitButton.disabled = true;

  // User's chat stripe
  const userChatStripe = createChatStripe(false, prompt);
  chatContainer.insertAdjacentHTML('beforeend', userChatStripe);

  // Clear the textarea input
  form.reset();

  // Scroll to the latest message
  scrollToLatestMessage();

  // Bot's chat stripe placeholder
  const uniqueId = generateUniqueId();
  const botChatStripe = createChatStripe(true, '', uniqueId);
  chatContainer.insertAdjacentHTML('beforeend', botChatStripe);

  const messageDiv = document.getElementById(uniqueId);

  // Show loading indicator
  loader(messageDiv);

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://educational-development.onrender.com/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // ✅ Use onload to ensure full response is available
    xhr.onload = function() {
      clearInterval(loadInterval);
      messageDiv.textContent = '';

      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const parsedData = (data.bot || '').trim();

        // Display full bot response
        messageDiv.innerHTML = `<span>${parsedData}</span>`;

        // Update botChats last entry with real text (for reading)
        if (botChats.length > 0) {
          botChats[botChats.length - 1].value = parsedData;
        }

        // Scroll to latest, re-enable input
        scrollToLatestMessage();
        submitButton.disabled = false;
        input.focus();

        // Feedback
        listenForFeedback(prompt, parsedData);

        // Auto start reading
        toggleReading(parsedData, botChats.length - 1);
      } else {
        const err = xhr.responseText;
        messageDiv.textContent = 'Something went wrong';
        console.error('Server error:', err);
        alert(err);
        submitButton.disabled = false;
      }
    };

    xhr.onerror = function() {
      clearInterval(loadInterval);
      messageDiv.textContent = 'Network error';
      console.error('Network error');
      submitButton.disabled = false;
    };

    xhr.send(JSON.stringify({ prompt: prompt }));
  } catch (error) {
    clearInterval(loadInterval);
    messageDiv.textContent = 'Something went wrong';
    console.error(error);
    submitButton.disabled = false;
  }
};

/* ================= FEEDBACK FUNCTIONS ================= */

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
    if (feedback === '') return;

    // Send the feedback to the server for model improvement
    sendFeedback(prompt, botResponse, feedback);

    // Remove the feedback form
    chatContainer.removeChild(feedbackContainer);
  });

  feedbackCancelButton.addEventListener('click', function() {
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

/* ================= SCROLL & EVENTS ================= */

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

// Scroll on initial load
window.addEventListener('load', function() {
  scrollToLatestMessage();
});

/* ================= BUTTON CONTAINERS ================= */

const printButtonContainer = document.getElementById('printButtonContainer');
const continueReadingButtonContainer = document.getElementById('continueReadingButtonContainer');
const muteButtonContainer = document.getElementById('muteButtonContainer');

printButtonContainer.appendChild(printButton);
continueReadingButtonContainer.appendChild(continueReadingButton);
muteButtonContainer.appendChild(muteButton);
      
