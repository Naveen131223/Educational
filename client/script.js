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
    thinkingTimeout = setTimeout(async () => {
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

          // Start reading the AI output
          toggleReading(parsedData, botChats.length - 1);
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
    }, 100); // Adjust the AI delay duration as needed
  } catch (error) {
    messageDiv.textContent = 'Something went wrong';
    console.error(error);

    // Re-enable the submit button after processing
    submitButton.disabled = false;
  }
};

// Function to listen for user feedback on the AI response
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

// Function to send feedback to the server for model improvement
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

// ... Your existing JavaScript code ...

const printButtonContainer = document.getElementById('printButtonContainer');
const continueReadingButtonContainer = document.getElementById('continueReadingButtonContainer');

printButtonContainer.appendChild(printButton);
continueReadingButtonContainer.appendChild(continueReadingButton);

// ... The rest of your existing JavaScript code ...


   fetch("https://harmless-wasp-45666.kv.vercel-storage.com/set/user_1_session/session_token_value", {
            headers: {
                Authorization: "Bearer AbJiASQgMTFmYWUwM2QtYWZiYS00MWMxLWI5YTItZDVkMTRiMjA3ZjdkYTc2NmFmYjM2YWFiNDc2NThmODBiNmYwNWRlNjVjMTY="
            }
        })
        .then(response => response.json())
        .then(data => console.log(data));




 // JavaScript to add gaps between buttons in mobile view
  function addGapsForMobileView() {
    const container = document.querySelector('.button-container');
    const buttons = container.querySelectorAll('.button');
    const containerWidth = container.offsetWidth;
    const totalButtonsWidth = Array.from(buttons).reduce((acc, button) => acc + button.offsetWidth, 0);
    const availableGap = containerWidth - totalButtonsWidth;

    if (availableGap > 0) {
      const gapsCount = buttons.length - 1;
      const gapSize = Math.floor(availableGap / gapsCount);
      const lastGapSize = availableGap - (gapSize * gapsCount);

      buttons.forEach((button, index) => {
        const marginRight = index < buttons.length - 1 ? gapSize + 'px' : lastGapSize + 'px';
        button.style.marginRight = marginRight;
      });
    }
  }



  // Call the function initially and on window resize to adjust the gaps
  addGapsForMobileView();
  window.addEventListener('resize', addGapsForMobileView);



var printButton = document.createElement("button");
printButton.textContent = "Print Chat"; // Updating the button text to "Print"
printButton.className = "add-course-button-1";
printButton.addEventListener("click", function() {
  var chatContainer = document.getElementById("chat_container");
  var chatContent = chatContainer.innerHTML;

  // Apply styling to the printed content
  var style = `
    <style>
      .question { color: blue; }
      .answer { color: red; }
      .line-break { display: block; margin-bottom: 1em; } /* Add space between lines */
    </style>`;

  // Replace line breaks with a styled span to add vertical space
  chatContent = chatContent.replace(/\n/g, '<span class="line-break"></span>');

  // Remove user input keyboard printout
  chatContent = chatContent.replace(/<span class="user-input">.+?<\/span>/g, '');

  var printWindow = window.open("", "_blank");
  printWindow.document.open();
  printWindow.document.write("<html><head><title>Print Chat</title>" + style + "</head><body>" + chatContent + "</body></html>");
  printWindow.document.close();

  // Execute the print function
  printWindow.print();
});

document.body.appendChild(printButton);





var exportChatButton = document.createElement("button");
exportChatButton.textContent = "Export Chat";
exportChatButton.className = "ExportChatButton";
exportChatButton.addEventListener("click", function() {
  var chatContainer = document.getElementById("chat_container");
  var chatContent = chatContainer.innerHTML;

  // Apply styling to the exported content
  var style = "<style> .question { color: blue; } .answer { color: red; } </style>";

  // Remove user input keyboard printout
  chatContent = chatContent.replace(/<span class="user-input">.+?<\/span>/g, '');

  var exportWindow = window.open("", "_blank");
  exportWindow.document.open();
  exportWindow.document.write("<html><head><title>Export Chat</title>" + style + "</head><body>" + chatContent + "</body></html>");
  exportWindow.document.close();
});

document.body.appendChild(exportChatButton);


function downloadTxtFile_8() {
    const content_8 = document.getElementById('chat_container').innerText;
    if (content_8.trim() === "") {
        alert("Chat container is empty.");
        return;
    }
    const lines_8 = content_8.split('\n').map(line => ' ' + line.trimStart()); // Ensure only one space at the start
    const formattedContent_8 = lines_8.join('\n'); // Join lines with a single newline
    const txtBlob_8 = new Blob([formattedContent_8], { type: 'text/plain' });
    const txtLink_8 = document.createElement('a');
    txtLink_8.href = URL.createObjectURL(txtBlob_8);
    txtLink_8.download = 'chat.txt';
    txtLink_8.click();
    document.getElementById('textFileBtn_8').style.backgroundColor = "#555555";
}





        function downloadDocFile_8() {
            const content_8 = document.getElementById('chat_container').innerText;
            if (content_8.trim() === "") {
                alert("Chat container is empty.");
                return;
            }
            const preHtml_8 = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>";
            const head_8 = "<head><meta charset='utf-8'><title>Document</title></head>";
            const style_8 = "<style>body { font-family: 'Times New Roman'; font-size: 12pt; margin-left: 1em; }</style>";
            const body_8 = "<body>" + content_8.split('\n').map(line => `<p style="margin: 0 0 1em 0;"> ${line}</p>`).join('') + "</body></html>";
            const docHtml_8 = preHtml_8 + head_8 + style_8 + body_8;

            const docBlob_8 = new Blob(['\ufeff', docHtml_8], { type: 'application/msword' });
            const docLink_8 = document.createElement('a');
            docLink_8.href = URL.createObjectURL(docBlob_8);
            docLink_8.download = 'chat.doc';
            docLink_8.click();
            document.getElementById('wordFileBtn_8').style.backgroundColor = "#555555";
        }




document.addEventListener('DOMContentLoaded', function() {
    const textFileBtn = document.getElementById('textFileBtn_8');
    const wordFileBtn = document.getElementById('wordFileBtn_8');

    function handleClick(event) {
        const button = event.target;
        const originalColor = button.style.backgroundColor;
        button.style.backgroundColor = '#555555'; // Dark Grey

        setTimeout(function() {
            button.style.backgroundColor = originalColor;
        }, 200); // Change back to original color after 200ms
    }

    textFileBtn.addEventListener('click', handleClick);
    wordFileBtn.addEventListener('click', handleClick);
});




// Function to handle speech recognition
function startSpeechRecognition() {
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  const recognition = new SpeechRecognition();
  const textArea = document.querySelector('textarea[name="prompt"]');
  
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    textArea.value += ' ' + transcript; // Add a space between the old and new text
  };

  // Start speech recognition
  recognition.start();

  // Stop speech recognition after 18 seconds
  setTimeout(() => {
    recognition.stop();
  }, 18000);


    
    // Set the languages to be recognized
recognition.lang = 'es-ES'; // Spanish
recognition.lang = 'fr-FR'; // French
recognition.lang = 'ta-IN'; // Tamil
recognition.lang = 'de-DE'; // German
recognition.lang = 'it-IT'; // Italian
recognition.lang = 'pt-BR'; // Portuguese (Brazil)
recognition.lang = 'ru-RU'; // Russian
recognition.lang = 'ko-KR'; // Korean
recognition.lang = 'ja-JP'; // Japanese
recognition.lang = 'zh-CN'; // Chinese (Simplified)
recognition.lang = 'af-ZA'; // Afrikaans
recognition.lang = 'ar-SA'; // Arabic
recognition.lang = 'az-AZ'; // Azerbaijani
recognition.lang = 'eu-ES'; // Basque
recognition.lang = 'be-BY'; // Belarusian
recognition.lang = 'bn-IN'; // Bengali (India)
recognition.lang = 'bs-BA'; // Bosnian
recognition.lang = 'bg-BG'; // Bulgarian
recognition.lang = 'ca-ES'; // Catalan
recognition.lang = 'ceb-PH'; // Cebuano
recognition.lang = 'ny-MW'; // Chichewa
recognition.lang = 'zh-TW'; // Chinese (Traditional)
recognition.lang = 'co-FR'; // Corsican
recognition.lang = 'hr-HR'; // Croatian
recognition.lang = 'cs-CZ'; // Czech
recognition.lang = 'da-DK'; // Danish
recognition.lang = 'nl-NL'; // Dutch
recognition.lang = 'en-US'; // English (United States)
recognition.lang = 'eo'; // Esperanto
recognition.lang = 'et-EE'; // Estonian
recognition.lang = 'fi-FI'; // Finnish
recognition.lang = 'fy-NL'; // Frisian
recognition.lang = 'gl-ES'; // Galician
recognition.lang = 'ka-GE'; // Georgian
recognition.lang = 'el-GR'; // Greek
recognition.lang = 'gu-IN'; // Gujarati
recognition.lang = 'ht-HT'; // Haitian Creole
recognition.lang = 'ha-HG'; // Hausa
recognition.lang = 'haw-US'; // Hawaiian
recognition.lang = 'he-IL'; // Hebrew
recognition.lang = 'hi-IN'; // Hindi
recognition.lang = 'hmn'; // Hmong
recognition.lang = 'hu-HU'; // Hungarian
recognition.lang = 'is-IS'; // Icelandic
recognition.lang = 'ig-NG'; // Igbo
recognition.lang = 'id-ID'; // Indonesian
recognition.lang = 'ga-IE'; // Irish
recognition.lang = 'it-IT'; // Italian
recognition.lang = 'ja-JP'; // Japanese
recognition.lang = 'jv-ID'; // Javanese
recognition.lang = 'kn-IN'; // Kannada
recognition.lang = 'kk-KZ'; // Kazakh
recognition.lang = 'km-KH'; // Khmer
recognition.lang = 'rw-RW'; // Kinyarwanda
recognition.lang = 'tlh-AA'; // Klingon
recognition.lang = 'ko-KR'; // Korean
recognition.lang = 'ku-TR'; // Kurdish
recognition.lang = 'ky-KG'; // Kyrgyz
recognition.lang = 'lo-LA'; // Lao
recognition.lang = 'la'; // Latin
recognition.lang = 'lv-LV'; // Latvian
recognition.lang = 'lt-LT'; // Lithuanian
recognition.lang = 'lb-LU'; // Luxembourgish
recognition.lang = 'mk-MK'; // Macedonian
recognition.lang = 'mg-MG'; // Malagasy
recognition.lang = 'ms-MY'; // Malay
recognition.lang = 'ml-IN'; // Malayalam
recognition.lang = 'mt-MT'; // Maltese
recognition.lang = 'mi-NZ'; // Maori
recognition.lang = 'mr-IN'; // Marathi
recognition.lang = 'mn-MN'; // Mongolian
recognition.lang = 'my-MM'; // Myanmar (Burmese)
recognition.lang = 'ne-NP'; // Nepali
recognition.lang = 'no-NO'; // Norwegian
recognition.lang = 'ps-AF'; // Pashto
recognition.lang = 'fa-IR'; // Persian
recognition.lang = 'pl-PL'; // Polish
recognition.lang = 'pt-PT'; // Portuguese (Portugal)
recognition.lang = 'pa-IN'; // Punjabi
recognition.lang = 'ro-RO'; // Romanian
recognition.lang = 'ru-RU'; // Russian
recognition.lang = 'sm-SM'; // Samoan
recognition.lang = 'gd-GB'; // Scottish Gaelic
recognition.lang = 'sr-RS'; // Serbian
recognition.lang = 'st-ZA'; // Sesotho
recognition.lang = 'sn-ZW'; // Shona
recognition.lang = 'sd-PK'; // Sindhi
recognition.lang = 'si-LK'; // Sinhala
recognition.lang = 'sk-SK'; // Slovak
recognition.lang = 'sl-SI'; // Slovenian
recognition.lang = 'so-SO'; // Somali
recognition.lang = 'es-ES'; // Spanish
recognition.lang = 'su-ID'; // Sundanese
recognition.lang = 'sw-TZ'; // Swahili
recognition.lang = 'sv-SE'; // Swedish
recognition.lang = 'tg-TJ'; // Tajik
recognition.lang = 'ta-IN'; // Tamil
recognition.lang = 'tt-RU'; // Tatar
recognition.lang = 'te-IN'; // Telugu
recognition.lang = 'th-TH'; // Thai
recognition.lang = 'tr-TR'; // Turkish
recognition.lang = 'tk-TM'; // Turkmen
recognition.lang = 'uk-UA'; // Ukrainian
recognition.lang = 'ur-PK'; // Urdu
recognition.lang = 'ug-CN'; // Uyghur
recognition.lang = 'uz-UZ'; // Uzbek
recognition.lang = 'vi-VN'; // Vietnamese
recognition.lang = 'cy-GB'; // Welsh
recognition.lang = 'xh-ZA'; // Xhosa
recognition.lang = 'yi-DE'; // Yiddish
recognition.lang = 'yo-NG'; // Yoruba
recognition.lang = 'zu-ZA'; // Zulu

    // Add more languages as needed
    
    recognition.start();
  }






var shareButton = document.createElement("button");
        shareButton.innerHTML = "Share";
        shareButton.className = "add-course-button-3";
        shareButton.onclick = sharePage;
        document.body.appendChild(shareButton);

			   
        var youtubeButton = document.createElement("button");
        youtubeButton.innerHTML = "YouTube Guidance in Tamil";
        youtubeButton.className = "add-course-button-2";
        youtubeButton.onclick = openYouTubeGuidance;
        document.body.appendChild(youtubeButton);

        var youtubeButton_1 = document.createElement("button");
        youtubeButton_1.innerHTML = "YouTube Guidance in English just 2 minute video";
        youtubeButton_1.className = "add-course-button-2";
        youtubeButton_1.onclick = openYouTubeGuidance_1;
        document.body.appendChild(youtubeButton_1);

        		

	function sharePage() {
            // Add your code for sharing the page here
            var linkToShare = 'https://educational-umber.vercel.app/';

      if (navigator.share) {
        navigator.share({
          url: linkToShare
        })
          .then(() => console.log('Link shared successfully.'))
          .catch((error) => console.log('Error sharing link:', error));
      } else {
        alert('Web Share API is not supported by your browser.');
      }
    
    
        }

	 

         function openYouTubeGuidance() {
            // Add your YouTube guidance link here
            var youtubeLink = "https://youtu.be/bMKzvjCFZao";
            // Add your code to open the YouTube link
            window.open(youtubeLink, "_blank");
        }

		  function openYouTubeGuidance_1() {
    var youtubeLink = "https://youtu.be/sGAGtM39qsA";
    window.open(youtubeLink, "_blank");
}


		  function animateLines() {
  var lines = document.getElementsByClassName('colorful');
  var delay = 10000; // 10 seconds

  function changeColorRandomly(element) {
    var colors = [
    '#000000' //black 
];
    var randomColor = colors[Math.floor(Math.random() * colors.length)];
    element.style.color = randomColor;
  }

  function animateLine(index) {
    setTimeout(function() {
      changeColorRandomly(lines[index]);
      animateLine((index + 1) % lines.length);
    }, delay);
  }

  for (var i = 0; i < lines.length; i++) {
    animateLine(i);
  }
}

window.onload = animateLines; 




	let activeIndicator = null;
let activeUtterance = null;
let readingEnabled = false; // Initially set to false

function handleClick(event) {
  if (!readingEnabled) {
    return;
  }

  const targetNode = event.target;

  if (targetNode.nodeName === 'SPAN') {
    const word = targetNode.textContent;
    if (!activeIndicator) {
      startReading(word, event.clientX, event.clientY + window.scrollY);
    }
  } else {
    if (!activeIndicator) {
      // Add an empty word for the indicator to appear
      const scrollY = window.scrollY;
      startReading('', event.clientX, event.clientY + scrollY);
      setTimeout(stopReading, 1000); // Hide after 1 second (1000 milliseconds)
    }
  }
}

function startReading(word, x, y) {
  if (activeUtterance) {
    activeUtterance.onend = null; // Remove previous onend handler
    stopReading();
  }

  activeUtterance = new SpeechSynthesisUtterance(word);
  activeUtterance.voice = getRomanticVoice();
  window.speechSynthesis.speak(activeUtterance);

  activeIndicator = document.createElement('div');
  activeIndicator.className = 'indicator';
  activeIndicator.style.left = (x - 10) + 'px';
  activeIndicator.style.top = (y - 10) + 'px';
  document.body.appendChild(activeIndicator);

  // Add the "visible" class to make the indicator visible
  activeIndicator.classList.add('visible');

  activeUtterance.onend = function() {
    stopReading();
  };
}

function stopReading() {
  if (activeUtterance) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
  if (activeIndicator) {
    activeIndicator.remove();
    activeIndicator = null;
  }
}

function getRomanticVoice() {
  const voices = window.speechSynthesis.getVoices();
  const romanticVoice = voices.find(voice => voice.name.includes('female') && voice.name.includes('romantic'));
  return romanticVoice || voices.find(voice => voice.name.includes('female')) || voices[0];
}

// Function to recursively traverse and process text nodes
function processTextNodes(node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
    const words = node.textContent.trim().split(/\s+/);
    const spannedWords = words.map(word => `<span>${word}</span>`).join(' ');
    const spanContainer = document.createElement('span');
    spanContainer.innerHTML = spannedWords;
    node.parentNode.replaceChild(spanContainer, node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    node.childNodes.forEach(processTextNodes);
  }
}

// Wait for the page to load before processing text nodes
window.addEventListener('DOMContentLoaded', function() {
  processTextNodes(document.body);
});

document.addEventListener('click', handleClick);

// Toggle button functionality
const toggleButton = document.createElement('div');
toggleButton.id = 'toggleButton';
toggleButton.className = 'off'; // Initially set to 'off'
toggleButton.textContent = 'Read Web Content Off'; // Button text for off state
document.body.appendChild(toggleButton);

toggleButton.addEventListener('click', function() {
  if (readingEnabled) {
    readingEnabled = false;
    toggleButton.classList.add('off');
    toggleButton.textContent = 'Read Web Content Off';
    stopReading();
  } else {
    readingEnabled = true;
    toggleButton.classList.remove('off');
    toggleButton.textContent = 'Read Web Content On';
  }
});


