var bot = './assets/bot.svg';
var user = './assets/user.svg';

var form = document.querySelector('form');
var chatContainer = document.querySelector('#chat_container');
var input = form.querySelector('textarea');
var submitButton = form.querySelector('button[type="submit"]');
var printButton = document.querySelector('#print_button');

var loadInterval;
var userChats = [];
var botChats = [];

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(function() {
    // Update the text content of the loading indicator
    element.textContent += '.';

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 100);
}

function generateUniqueId() {
  var timestamp = Date.now();
  var randomNumber = Math.random();
  var hexadecimalString = randomNumber.toString(16).slice(2, 8); // Generate a 6-digit hexadecimal string

  return 'id-' + timestamp + '-' + hexadecimalString;
}

function createChatStripe(isAi, value, uniqueId) {
  var profileImg = isAi ? bot : user;
  var message = { isAi, value };

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

var thinkingTimeout;

var handleSubmit = async function(e) {
  e.preventDefault();

  var prompt = input.value.trim();

  if (prompt === '') {
    // Do not submit if the prompt is empty
    return;
  }

  // Disable the submit button while processing
  submitButton.disabled = true;

  // User's chat stripe
  var userChatStripe = createChatStripe(false, prompt);
  chatContainer.insertAdjacentHTML('beforeend', userChatStripe);

  // Clear the textarea input
  form.reset();

  // Scroll to the latest message after inserting the user's chat stripe
  scrollToLatestMessage();

  // Bot's chat stripe
  var uniqueId = generateUniqueId();
  var botChatStripe = createChatStripe(true, '', uniqueId);
  chatContainer.insertAdjacentHTML('beforeend', botChatStripe);

  // Get the message div
  var messageDiv = document.getElementById(uniqueId);

  // Show the loading indicator
  loader(messageDiv);

  try {
    // Simulate AI "thinking" with a shorter delay
    thinkingTimeout = setTimeout(async function() {
      // Fetch the response from the server
      var response = await fetch('https://educational-development.onrender.com/', {
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
        var data = await response.json();
        var parsedData = data.bot.trim(); // Trim any trailing spaces or '\n'

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
        var err = await response.text();

        messageDiv.textContent = 'Something went wrong';
        alert(err);

        // Re-enable the submit button after processing
        submitButton.disabled = false;
      }
    }, 80); // Adjust the delay duration as needed
  } catch (error) {
    messageDiv.textContent = 'Something went wrong';
    console.error(error);

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  }
};

// Function to listen for user feedback on the AI response
var listenForFeedback = function(prompt, botResponse) {
  var feedbackForm = document.createElement('form');
  var feedbackInput = document.createElement('input');
  var feedbackSubmitButton = document.createElement('button');
  var feedbackCancelButton = document.createElement('button');

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

  var feedbackContainer = document.createElement('div');
  feedbackContainer.classList.add('feedback-container');
  feedbackContainer.appendChild(feedbackForm);

  chatContainer.appendChild(feedbackContainer);

  feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var feedback = feedbackInput.value.trim();

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
var sendFeedback = async function(prompt, botResponse, feedback) {
  try {
    var response = await fetch('https://educational-development.onrender.com/feedback', {
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

// Function to render the chat messages on the webpage
function renderChatMessages() {
  chatContainer.innerHTML = '';

  for (var i = 0; i < userChats.length; i++) {
    var userMessage = userChats[i].value;
    var userChatStripe = createChatStripe(false, userMessage);
    chatContainer.insertAdjacentHTML('beforeend', userChatStripe);
  }

  for (var i = 0; i < botChats.length; i++) {
    var botMessage = botChats[i].value;
    var uniqueId = generateUniqueId();
    var botChatStripe = createChatStripe(true, botMessage, uniqueId);
    chatContainer.insertAdjacentHTML('beforeend', botChatStripe);
  }

  scrollToLatestMessage();
}

// Event listener for the print button
printButton.addEventListener('click', function() {
  // Hide the print button
  printButton.style.display = 'none';

  // Create a new window for printing
  var printWindow = window.open('', '_blank');

  // Set the HTML content of the print window
  printWindow.document.open();
  printWindow.document.write('<html><head><title>Chat Transcript</title></head><body>');
  printWindow.document.write('<h1>Chat Transcript</h1>');
  printWindow.document.write(chatContainer.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();

  // Wait for the window content to load before printing
  printWindow.onload = function() {
    printWindow.print();

    // Close the print window after printing
    printWindow.close();

    // Show the print button again
    printButton.style.display = 'block';
  };
});
