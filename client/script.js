import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const input = form.querySelector('textarea');
const submitButton = form.querySelector('button[type="submit"]');

const generateUniqueId = () => {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16).slice(2, 8); // Generate a 6-digit hexadecimal string

  return `id-${timestamp}-${hexadecimalString}`;
};

const createChatStripe = (isAi, value, uniqueId) => {
  const profileImg = isAi ? bot : user;

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
};

const loader = (element) => {
  element.textContent = '';

  const loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 100);
  
  return loadInterval;
};

const fetchBotResponse = async (prompt, uniqueId) => {
  const messageDiv = document.getElementById(uniqueId);

  try {
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
      messageDiv.innerHTML = `
        <span>${parsedData}</span>
      `;

      // Scroll to the latest message after rendering the response
      scrollToLatestMessage();

      // Re-enable the submit button after processing
      submitButton.disabled = false;

      // Focus on the input field for the next response
      input.focus();

      // Listen for user feedback on the response
      listenForFeedback(prompt, parsedData);
    } else {
      const err = await response.text();

      messageDiv.textContent = 'Something went wrong';
      alert(err);

      // Re-enable the submit button after processing
      submitButton.disabled = false;
    }
  } catch (error) {
    messageDiv.textContent = 'Something went wrong';
    console.error(error);

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  }
};

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
  const loadInterval = loader(messageDiv);

  // Simulate AI "thinking" with a shorter delay
  setTimeout(() => {
    fetchBotResponse(prompt, uniqueId);
  }, 800); // Adjust the delay duration as needed
};

const listenForFeedback = (prompt, botResponse) => {
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

  feedbackForm.addEventListener('submit', (e) => {
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

  feedbackCancelButton.addEventListener('click', () => {
    // Remove the feedback form from the chat
    chatContainer.removeChild(feedbackContainer);
  });
};

const sendFeedback = async (prompt, botResponse, feedback) => {
  try {
    const response = await fetch('https://educational-development.onrender.com/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        botResponse: botResponse,
        feedback: feedback,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send feedback:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error sending feedback:', error);
  }
};

const scrollToLatestMessage = () => {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth',
  });
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  handleSubmit();
};

form.addEventListener('submit', handleFormSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleFormSubmit(e);
  }
});

// Auto-scroll to the latest message smoothly
const handleWindowLoad = () => {
  scrollToLatestMessage();
};

window.addEventListener('load', handleWindowLoad);
