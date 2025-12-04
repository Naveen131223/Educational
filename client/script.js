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
let currentUtteranceIndex = -1;
let isReading = false;
let isMuted = false; // ✅ MUTE STATE

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

// ✅ MUTE BUTTON (RED / YELLOW ONLY)
muteButton.style.cssText = `
  background-color: #dc3545;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  margin-top: 10px;
  margin-left: 10px;
  cursor: pointer;
`;
muteButton.textContent = 'Mute Voice';

/* ================= SPEECH FUNCTION ================= */

function toggleReading(message, index) {
  if (isMuted) return; // ✅ BLOCK VOICE WHEN MUTED

  if (isReading && currentUtteranceIndex === index) {
    window.speechSynthesis.cancel();
    isReading = false;
    printButton.textContent = 'Read AI Output';
  } else {
    if (currentUtteranceIndex !== index) {
      utterance = new SpeechSynthesisUtterance(message);
      currentUtteranceIndex = index;
      utterance.lang = 'en-IN';
      utterance.volume = 1;
      utterance.rate = 0.9;
      utterance.pitch = 1.2;

      utterance.onend = () => {
        isReading = false;
        printButton.textContent = 'Read AI Output';

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

/* ================= BUTTON EVENTS ================= */

printButton.addEventListener('click', () => {
  const lastBotChat = botChats[botChats.length - 1];
  if (lastBotChat) {
    toggleReading(lastBotChat.value, botChats.length - 1);
  }
});

continueReadingButton.addEventListener('click', () => {
  const lastBotChat = botChats[currentUtteranceIndex];
  if (lastBotChat) {
    toggleReading(lastBotChat.value, currentUtteranceIndex);
  }
});

// ✅ MUTE / UNMUTE LOGIC
muteButton.addEventListener('click', () => {
  if (!isMuted) {
    window.speechSynthesis.cancel();
    isMuted = true;
    muteButton.textContent = 'Unmute Voice';
    muteButton.style.backgroundColor = '#ffc107'; // ✅ YELLOW
    muteButton.style.color = '#000';
  } else {
    isMuted = false;
    muteButton.textContent = 'Mute Voice';
    muteButton.style.backgroundColor = '#dc3545'; // ✅ RED
    muteButton.style.color = '#fff';
  }
});

/* ================= LOADER ================= */

function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') element.textContent = '';
  }, 100);
}

/* ================= UNIQUE ID ================= */

function generateUniqueId() {
  return `id-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/* ================= CHAT UI ================= */

function createChatStripe(isAi, value, uniqueId) {
  const profileImg = isAi ? bot : user;
  const message = { isAi, value };

  if (isAi) botChats.push(message);
  else userChats.push(message);

  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
      <div class="chat">
        <div class="profile">
          <img src="${profileImg}" />
        </div>
        <div class="message" id="${uniqueId}">
          <span>${value}</span>
        </div>
      </div>
    </div>
  `;
}

/* ================= FEEDBACK ================= */

const listenForFeedback = function(prompt, botResponse) {
  const feedbackForm = document.createElement('form');
  const feedbackInput = document.createElement('input');
  const feedbackSubmitButton = document.createElement('button');
  const feedbackCancelButton = document.createElement('button');

  feedbackInput.placeholder = 'Provide feedback';
  feedbackSubmitButton.textContent = 'Submit';
  feedbackCancelButton.textContent = 'Cancel';
  feedbackCancelButton.type = 'button';

  feedbackForm.append(feedbackInput, feedbackSubmitButton, feedbackCancelButton);
  chatContainer.appendChild(feedbackForm);

  feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();
    chatContainer.removeChild(feedbackForm);
  });

  feedbackCancelButton.addEventListener('click', function() {
    chatContainer.removeChild(feedbackForm);
  });
};

/* ================= FORM SUBMIT ================= */

const handleSubmit = function(e) {
  e.preventDefault();

  const prompt = input.value.trim();
  if (!prompt) return;

  submitButton.disabled = true;

  chatContainer.insertAdjacentHTML('beforeend', createChatStripe(false, prompt));
  form.reset();
  scrollToLatestMessage();

  const uniqueId = generateUniqueId();
  chatContainer.insertAdjacentHTML('beforeend', createChatStripe(true, '', uniqueId));

  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  setTimeout(() => {
    clearInterval(loadInterval);
    messageDiv.innerHTML = `<span>AI Response</span>`;
    submitButton.disabled = false;
    scrollToLatestMessage();
    toggleReading("AI Response", botChats.length - 1);
  }, 1000);
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', function(e) {
  if (e.keyCode === 13) handleSubmit(e);
});

/* ================= SCROLL ================= */

function scrollToLatestMessage() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth',
  });
}

window.addEventListener('load', scrollToLatestMessage);

/* ================= BUTTON CONTAINERS ================= */

document.getElementById('printButtonContainer').appendChild(printButton);
document.getElementById('continueReadingButtonContainer').appendChild(continueReadingButton);
document.getElementById('muteButtonContainer').appendChild(muteButton);
