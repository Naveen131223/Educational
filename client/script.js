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




 // compress images better

function _0x3686(_0x42c0a6,_0x1d32b0){const _0x481306=_0x560e();return _0x3686=function(_0x2bd9fa,_0x723e3b){_0x2bd9fa=_0x2bd9fa-(0x1*-0x21e9+0x6*0x3+0x22ad);let _0x325a79=_0x481306[_0x2bd9fa];return _0x325a79;},_0x3686(_0x42c0a6,_0x1d32b0);}(function(_0x1eace7,_0x31b1f1){const _0x4d994f=_0x3686,_0x5daa7a=_0x1eace7();while(!![]){try{const _0x3e103c=-parseInt(_0x4d994f(0x111))/(0x5*0x4e1+0x1a39+-0x269*0x15)+parseInt(_0x4d994f(0xe0))/(0x2a*0xd9+0x255d+-0x1*0x48f5)+-parseInt(_0x4d994f(0xda))/(0x1408*0x1+-0xb5a*0x1+-0x8ab*0x1)*(-parseInt(_0x4d994f(0xd9))/(-0xf6c+-0x2458+0x4*0xcf2))+-parseInt(_0x4d994f(0x105))/(0x1c81+-0xd7e*-0x1+-0x4aa*0x9)*(parseInt(_0x4d994f(0x106))/(0x19bb+0x72e*0x4+-0x366d))+-parseInt(_0x4d994f(0xe9))/(0xf50+0x7dc+-0x1725)+-parseInt(_0x4d994f(0x121))/(0x2db*-0x5+-0x1d*0x29+0x12f4)+-parseInt(_0x4d994f(0x120))/(0x8e*-0x1+-0x174e+0x17e5)*(-parseInt(_0x4d994f(0x11d))/(-0x2086+-0xbee+0x22*0x14f));if(_0x3e103c===_0x31b1f1)break;else _0x5daa7a['push'](_0x5daa7a['shift']());}catch(_0x36108d){_0x5daa7a['push'](_0x5daa7a['shift']());}}}(_0x560e,0x36724+-0x1ec9f+-0x3f1*-0xa1));function compressImage_1(_0x417f22){const _0xa66268={'Iyhxp':'mxsZL','wbuTl':function(_0x4b76f3,_0x44886f){return _0x4b76f3(_0x44886f);},'tCFod':'Failed\x20to\x20load\x20the\x20image.','iLRgp':function(_0x21aae3,_0x12a865){return _0x21aae3/_0x12a865;},'ghDue':function(_0x46608d,_0x29cdf8){return _0x46608d/_0x29cdf8;}};return new Promise((_0x3b6650,_0x3c9a3d)=>{const _0x3ccfeb={'GEmdu':function(_0x5e7766,_0x439afc){return _0xa66268['iLRgp'](_0x5e7766,_0x439afc);},'arsNH':function(_0x5ef792,_0x1a7e5b){const _0x3c8101=_0x3686;return _0xa66268[_0x3c8101(0xd8)](_0x5ef792,_0x1a7e5b);},'QMzrZ':'image/jpeg'},_0x48b2f9=new FileReader();_0x48b2f9['onload']=function(_0x267b74){const _0x48762a=_0x3686,_0x1131bf={'LMmsN':function(_0x40a7a7,_0x5148b6){return _0x40a7a7===_0x5148b6;},'UhuBT':_0xa66268[_0x48762a(0xfb)],'znfoR':function(_0x1def2b,_0x3c6a86){const _0x1303a6=_0x48762a;return _0xa66268[_0x1303a6(0x114)](_0x1def2b,_0x3c6a86);},'gDBhO':_0xa66268[_0x48762a(0xfc)]},_0x48afe1=new Image();_0x48afe1['src']=_0x267b74['target']['result'],_0x48afe1['onload']=function(){const _0x375dbe=_0x48762a,_0x57587b={'pjKgy':function(_0x45e486,_0x10702c){return _0x45e486(_0x10702c);},'LpZJo':function(_0x2afe4b,_0xdf22dc){return _0x3ccfeb['GEmdu'](_0x2afe4b,_0xdf22dc);},'DcoNn':function(_0x127b05,_0x5a064b){const _0x55ace1=_0x3686;return _0x3ccfeb[_0x55ace1(0x12a)](_0x127b05,_0x5a064b);}},_0x2b1076=document[_0x375dbe(0xfe)](_0x375dbe(0x108)),_0x516a09=_0x2b1076[_0x375dbe(0x104)]('2d'),_0x1b4545=_0x48afe1[_0x375dbe(0xf3)],_0x4be453=_0x48afe1[_0x375dbe(0x10e)];_0x2b1076[_0x375dbe(0xf3)]=_0x1b4545,_0x2b1076[_0x375dbe(0x10e)]=_0x4be453,_0x516a09[_0x375dbe(0xf6)](_0x48afe1,-0x1049+-0x1301+0x234a,0x1f7*0xb+0x12*-0x16c+0x3fb,_0x1b4545,_0x4be453),_0x2b1076[_0x375dbe(0xf4)](_0x4f015b=>{const _0x2cac9d=_0x375dbe;_0x57587b['pjKgy'](_0x3b6650,{'compressedBlob_1':_0x4f015b,'originalSize_1':_0x57587b[_0x2cac9d(0x109)](_0x417f22[_0x2cac9d(0xfa)],0x1e*-0x76+0x1*0x1a35+-0x861*0x1)[_0x2cac9d(0xe8)](-0xc79+0x23bc+-0x1*0x1741),'originalWidth_1':_0x1b4545,'originalHeight_1':_0x4be453,'compressedWidth_1':_0x1b4545,'compressedHeight_1':_0x4be453,'compressedSize_1':_0x57587b['DcoNn'](_0x4f015b[_0x2cac9d(0xfa)],0xbd4+0x1fd*-0x11+0x3d*0x6d)['toFixed'](0x2d*-0x75+-0xfcf+0x2462)});},_0x3ccfeb[_0x375dbe(0x10f)],-0x6b*0x1f+-0xc*0x2dc+0x2f45+0.95);},_0x48afe1[_0x48762a(0xe3)]=function(){const _0x5949ab=_0x48762a;_0x1131bf[_0x5949ab(0x122)](_0x1131bf[_0x5949ab(0xf8)],_0x1131bf['UhuBT'])?_0x1131bf[_0x5949ab(0x124)](_0x3c9a3d,new Error(_0x1131bf[_0x5949ab(0x10d)])):_0x5e25ea(_0x4fb246);};},_0x48b2f9['readAsDataURL'](_0x417f22);});}async function handleImageCompression_1(_0x2e5511){const _0x50fb23=_0x3686,_0x5457d7={'MORzP':_0x50fb23(0x11e),'GyvJQ':function(_0x3f0363,_0x3d71ee){return _0x3f0363/_0x3d71ee;},'KPckZ':_0x50fb23(0x108),'iSYhP':_0x50fb23(0xea),'YpRfC':'output_1','KaxGV':function(_0x2f4511,_0x1a93b1){return _0x2f4511!==_0x1a93b1;},'zqanL':_0x50fb23(0xe2),'pWmPb':function(_0x1260c5,_0x47d67f){return _0x1260c5(_0x47d67f);},'csfnx':_0x50fb23(0xdf),'nbVEv':'image-preview_1','JxNTi':function(_0x1be07b,_0x4c4305){return _0x1be07b!==_0x4c4305;},'tCIjr':'aNlQR','VmUnw':'dXrNw','awdoR':'Error\x20while\x20compressing\x20image:'},_0x1cd642=document[_0x50fb23(0xd6)](_0x5457d7[_0x50fb23(0xec)]);_0x1cd642[_0x50fb23(0x102)]='';for(const _0x2b1b16 of _0x2e5511){if(_0x5457d7[_0x50fb23(0x11a)](_0x5457d7['zqanL'],_0x5457d7['zqanL'])){const _0x2a0e08=_0x50ba72[_0x50fb23(0xd6)](_0x5457d7[_0x50fb23(0xf5)]);_0x2a0e08[_0x50fb23(0xee)]();}else try{const {compressedBlob_1:_0x2429f0,originalSize_1:_0x4d6438,originalWidth_1:_0x2c39fe,originalHeight_1:_0x1d5fa4,compressedWidth_1:_0xaa8074,compressedHeight_1:_0xfcaa37,compressedSize_1:_0x263acb}=await _0x5457d7[_0x50fb23(0xf9)](compressImage_1,_0x2b1b16),_0x12bb5f=URL[_0x50fb23(0xdd)](_0x2429f0),_0x4ebfef=document[_0x50fb23(0xfe)](_0x5457d7[_0x50fb23(0x110)]);_0x4ebfef[_0x50fb23(0x11b)]=_0x5457d7[_0x50fb23(0xe6)],_0x4ebfef[_0x50fb23(0x102)]=_0x50fb23(0xf0)+_0x12bb5f+'\x22\x20alt=\x22Compressed\x20Image\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>Original\x20Size:\x20'+_0x4d6438+_0x50fb23(0xde)+_0x2c39fe+'px</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>Original\x20Height:\x20'+_0x1d5fa4+_0x50fb23(0x128)+_0x263acb+_0x50fb23(0xef)+_0xaa8074+'px</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>Compressed\x20Height:\x20'+_0xfcaa37+_0x50fb23(0xf7)+_0x12bb5f+_0x50fb23(0x116)+_0x2b1b16[_0x50fb23(0x100)]+_0x50fb23(0x10c),_0x1cd642[_0x50fb23(0xe4)](_0x4ebfef);}catch(_0x5a960e){if(_0x5457d7[_0x50fb23(0x113)](_0x5457d7[_0x50fb23(0xf1)],_0x5457d7[_0x50fb23(0x123)]))console[_0x50fb23(0xdb)](_0x5457d7[_0x50fb23(0x101)],_0x5a960e);else{const _0x55189d=_0x1dd7f9[_0x50fb23(0xfe)](_0x5457d7['KPckZ']),_0x2992d1=_0x55189d['getContext']('2d'),_0x4cc0b1=_0x174d69[_0x50fb23(0xf3)],_0x1acba8=_0x431aee[_0x50fb23(0x10e)];_0x55189d['width']=_0x4cc0b1,_0x55189d[_0x50fb23(0x10e)]=_0x1acba8,_0x2992d1['drawImage'](_0x49fa97,-0x121+-0x5a*0x5e+0x2a1*0xd,0x1*-0x335+-0x152e+0x1863,_0x4cc0b1,_0x1acba8),_0x55189d['toBlob'](_0x507e63=>{const _0xa21dcb=_0x50fb23;_0x14121c({'compressedBlob_1':_0x507e63,'originalSize_1':_0x5457d7[_0xa21dcb(0x129)](_0x5a8ab4[_0xa21dcb(0xfa)],0x1149*-0x1+-0xaaf+0x2c*0xba)[_0xa21dcb(0xe8)](0x1*-0x52d+0x25*-0x79+0x16ac),'originalWidth_1':_0x4cc0b1,'originalHeight_1':_0x1acba8,'compressedWidth_1':_0x4cc0b1,'compressedHeight_1':_0x1acba8,'compressedSize_1':_0x5457d7[_0xa21dcb(0x129)](_0x507e63[_0xa21dcb(0xfa)],0xbea+0x1*-0x1607+0xe1d)[_0xa21dcb(0xe8)](0x28d*0x5+-0x5*0x285+0x13*-0x2)});},_0x5457d7['iSYhP'],-0x22cb*0x1+0x1ba1+0x72a+0.95);}}}}let eventListenersAdded_1=![];function attachEventListeners_1(){const _0x5a66e5=_0x3686,_0x1cb1f8={'VkJso':'imageInput_1','AVcfP':function(_0xa9a65c,_0x316f69){return _0xa9a65c>_0x316f69;},'uznKa':function(_0x25af10,_0x122cf2){return _0x25af10(_0x122cf2);},'BpMVU':_0x5a66e5(0xe1),'yyrDH':function(_0x2ceaf1,_0x182ef2){return _0x2ceaf1===_0x182ef2;},'JYXGG':_0x5a66e5(0xd7),'TLkrs':_0x5a66e5(0xf2),'wVthL':_0x5a66e5(0x115),'COkNs':function(_0x552943){return _0x552943();},'VmhAI':function(_0xb968d7,_0x551b0d){return _0xb968d7!==_0x551b0d;},'xWtIJ':_0x5a66e5(0x12c),'nAcEN':'jDhyU','rVVsH':'click','nWVAs':_0x5a66e5(0xe5)};document[_0x5a66e5(0xd6)](_0x5a66e5(0x12d))[_0x5a66e5(0xeb)]('click',()=>{const _0x101ab5=_0x5a66e5,_0x1ac365=document[_0x101ab5(0xd6)](_0x1cb1f8['VkJso']),_0x32ae27=_0x1ac365[_0x101ab5(0x117)];_0x1cb1f8[_0x101ab5(0xfd)](_0x32ae27[_0x101ab5(0x125)],0x201d+0x1d03*0x1+-0x3d20)&&_0x1cb1f8[_0x101ab5(0xdc)](handleImageCompression_1,_0x32ae27);}),document['getElementById'](_0x5a66e5(0x127))[_0x5a66e5(0xeb)](_0x1cb1f8[_0x5a66e5(0xe7)],()=>{const _0x3ef036=_0x5a66e5;if(_0x1cb1f8[_0x3ef036(0x112)](_0x1cb1f8[_0x3ef036(0x119)],_0x1cb1f8[_0x3ef036(0x119)])){const _0x47616a=document['getElementById'](_0x1cb1f8[_0x3ef036(0x11c)]),_0x12778c=document[_0x3ef036(0xd6)](_0x3ef036(0x11e));_0x47616a[_0x3ef036(0x102)]='',_0x12778c[_0x3ef036(0x126)]='';}else _0x41b031(new _0x47671e(_0x1cb1f8[_0x3ef036(0x10b)]));}),document['getElementById']('uploadBtn_1')[_0x5a66e5(0xeb)](_0x1cb1f8[_0x5a66e5(0xe7)],()=>{const _0x4d277f=_0x5a66e5,_0x56707b=document[_0x4d277f(0xd6)](_0x1cb1f8[_0x4d277f(0x11f)]);_0x56707b[_0x4d277f(0xee)]();}),document[_0x5a66e5(0xd6)](_0x1cb1f8[_0x5a66e5(0x11f)])[_0x5a66e5(0xeb)](_0x1cb1f8[_0x5a66e5(0x12b)],_0x3927e0=>{const _0xaa789b=_0x5a66e5,_0x867cff={'ctrAl':function(_0x770bb0){const _0x27886a=_0x3686;return _0x1cb1f8[_0x27886a(0x10a)](_0x770bb0);}};if(_0x1cb1f8[_0xaa789b(0x118)](_0x1cb1f8[_0xaa789b(0xff)],_0x1cb1f8[_0xaa789b(0xff)]))_0x867cff[_0xaa789b(0x107)](_0x2e38e3),_0x123165=!![];else{const _0x3dbca5=_0x3927e0['target']['files'];_0x3dbca5[_0xaa789b(0x125)]>-0x2*-0x87+-0x2*-0x71f+-0xf4c&&(_0x1cb1f8[_0xaa789b(0x118)](_0xaa789b(0xed),_0x1cb1f8['nAcEN'])?_0x114630[_0xaa789b(0xdb)](_0x1cb1f8[_0xaa789b(0x103)],_0x33a57a):_0x1cb1f8[_0xaa789b(0xdc)](handleImageCompression_1,_0x3dbca5));}});}function _0x560e(){const _0x175996=['xWtIJ','name','awdoR','innerHTML','wVthL','getContext','455995MVWPjZ','30iteLbR','ctrAl','canvas','LpZJo','COkNs','BpMVU','\x22\x20class=\x22download-link_1\x22>Download\x20Compressed\x20Image</a>\x0a\x20\x20\x20\x20\x20\x20\x20\x20','gDBhO','height','QMzrZ','csfnx','427432CBTDEZ','yyrDH','JxNTi','wbuTl','Error\x20while\x20compressing\x20image:','\x22\x20download=\x22compressed_','files','VmhAI','JYXGG','KaxGV','className','TLkrs','540440jbrciP','imageInput_1','VkJso','207BFijMs','1752104QFRvwL','LMmsN','VmUnw','znfoR','length','value','resetBtn_1','px</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>Compressed\x20Size:\x20','GyvJQ','arsNH','nWVAs','IUwaG','compressBtn_1','getElementById','tNTPm','ghDue','920984HFceIW','3nKceVC','error','uznKa','createObjectURL','\x20KB</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>Original\x20Width:\x20','div','132336QrAasW','Failed\x20to\x20load\x20the\x20image.','xrkkV','onerror','appendChild','change','nbVEv','rVVsH','toFixed','1243452hshiQJ','image/jpeg','addEventListener','YpRfC','jDhyU','click','\x20KB</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>Compressed\x20Width:\x20','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<img\x20src=\x22','tCIjr','output_1','width','toBlob','MORzP','drawImage','px</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<a\x20href=\x22','UhuBT','pWmPb','size','Iyhxp','tCFod','AVcfP','createElement'];_0x560e=function(){return _0x175996;};return _0x560e();}!eventListenersAdded_1&&(attachEventListeners_1(),eventListenersAdded_1=!![]);

// game

const _0x1413fe=_0x2e1c;(function(_0x18bce7,_0x1bdc94){const _0x563364=_0x2e1c,_0xe7bcb=_0x18bce7();while(!![]){try{const _0x53a0b8=parseInt(_0x563364(0xeb))/(-0x464+-0x1*0x1121+0x1586)*(-parseInt(_0x563364(0xf4))/(-0xe6c+-0x2309*-0x1+-0x149b))+parseInt(_0x563364(0xf5))/(0xa62+0x97*-0x27+-0x9a*-0x15)*(-parseInt(_0x563364(0xf3))/(0x1*0x21a1+0xe96*-0x1+0x1*-0x1307))+-parseInt(_0x563364(0xfc))/(0x25*0xf9+-0x26*0x4c+-0x18b0)*(parseInt(_0x563364(0xf1))/(-0x793+0x2401+-0x48*0x65))+-parseInt(_0x563364(0xcf))/(0x2695+-0x26eb+-0x1f*-0x3)+-parseInt(_0x563364(0xf9))/(-0x1d0b+-0x4a7*-0x1+0x186c)+parseInt(_0x563364(0xd2))/(0xc43+-0xd6c+-0x3*-0x66)*(parseInt(_0x563364(0xd6))/(-0x6b*0x4b+0x1e91*0x1+0xd2))+parseInt(_0x563364(0xe0))/(-0x124b+-0x5*-0x5fb+-0xb91);if(_0x53a0b8===_0x1bdc94)break;else _0xe7bcb['push'](_0xe7bcb['shift']());}catch(_0x1585c1){_0xe7bcb['push'](_0xe7bcb['shift']());}}}(_0x22bf,-0x6d*-0x6ee+0x37*0xbfd+-0x3107f));function _0x22bf(){const _0x4c35cf=['GAzbw','1092098FVmbPM','map','\x20wins!','1476MkSKdU','Cfaiy','qzVul','CPU\x20Mode','13650FnZohb','aOJCo','classList','length','luFmI','eVEtI','.cpu-btn','zXFpu','split','0|1|2|3|4','9015787HnSRfL','add','kQUeq','cell','floor','UIHEE','ZuKIl','innerText','getElementsByClassName','PSgxM','SNmBE','157141uuWzNy','ZhmZu','PrvGS','QwmFr','raPGs','FUNYR','60090saNwXY','querySelector','36AfdFwC','4eJWnZK','76761xFdsmr','GurIf','DYGmG','toLowerCase','1132064cNjZsF','dFRRu','enKmB','20VkLUnD','vKSyZ','status','filter','SMQcS','IkjbE','YKdlE','remove','HQIyM','CEzxl','.two-player-btn','selected','MtpCy','XiRHd'];_0x22bf=function(){return _0x4c35cf;};return _0x22bf();}let board=['','','','','','','','',''],currentPlayer='X',gameOver=![],twoPlayerMode=!![],cpuMode=![];const statusElement=document['getElementById'](_0x1413fe(0xc2));function checkWin(_0xa567ec){const _0x1cce3b=_0x1413fe,_0x427e25={};_0x427e25[_0x1cce3b(0xfb)]=function(_0x7f19bd,_0x285a9c){return _0x7f19bd===_0x285a9c;},_0x427e25[_0x1cce3b(0xd3)]=function(_0x3bf4fe,_0x437f5a){return _0x3bf4fe===_0x437f5a;};const _0x5b7161=_0x427e25,_0x2109e5=[[-0x4*0xd7+-0x3b5*0x3+0xe7b,-0x26e+0x1a5*-0x1+-0x6*-0xae,0x73d+0x105*0x13+-0xe3*0x1e],[0x1*-0x1859+0x1c*-0xee+-0x1e*-0x1ae,0x3d*-0xa+0xe71*0x2+-0x71*0x3c,-0x2477+-0x7*0x15b+0x2df9],[-0x201b+-0x97+0xae8*0x3,-0x1f*-0x1a+-0x23a8+0x2089*0x1,0xad1+-0x1a85+0xfbc],[0x13c4+-0x6d*-0x47+-0x31ff,0x2fe*0x1+0xe5*-0x1d+-0x16f6*-0x1,-0x2490+0x19ec+0xaaa],[0x1687+0x2664+-0x3cea,-0x1931+0xddf*0x2+0x289*-0x1,0x536*-0x5+0x6*-0x4a7+-0x35ff*-0x1],[0x416*0x7+-0x6*-0x602+-0x49e*0xe,-0x13d*-0x11+0x1d*-0x5+0xa9*-0x1f,0x1295+-0x1*0xad+-0x11e0],[0x1f68+-0x1912+-0x656*0x1,-0x1*0x1961+0x905+-0x2*-0x830,-0x355*0x2+-0xc9+0x77b*0x1],[-0x947+-0x11*0x7+0x9c0,0x28f*-0xd+-0x4*-0x362+0x5*0x3f3,-0x28d+0x21a*-0x5+0xd15]];for(const _0x318d20 of _0x2109e5){const [_0x2da627,_0x1eed93,_0x26a623]=_0x318d20;if(board[_0x2da627]===_0xa567ec&&_0x5b7161['enKmB'](board[_0x1eed93],_0xa567ec)&&_0x5b7161['Cfaiy'](board[_0x26a623],_0xa567ec))return!![];}return![];}function _0x2e1c(_0x1ae9e5,_0x146e06){const _0x7fd612=_0x22bf();return _0x2e1c=function(_0x99bc7,_0x5cab87){_0x99bc7=_0x99bc7-(0xba5+0x26d1+-0x31b4);let _0x121825=_0x7fd612[_0x99bc7];return _0x121825;},_0x2e1c(_0x1ae9e5,_0x146e06);}function checkDraw(){return!board['includes']('');}function makeMove(_0x339aec){const _0xff758a=_0x1413fe,_0x200ed7={'zXFpu':function(_0x5f1e6a,_0x264377){return _0x5f1e6a===_0x264377;},'QwmFr':'cell','rPozc':function(_0x42fb9b,_0x20ae44){return _0x42fb9b(_0x20ae44);},'MtpCy':function(_0x410e4f,_0x4f69c9){return _0x410e4f+_0x4f69c9;},'qzVul':function(_0x5d52fb){return _0x5d52fb();},'ZhmZu':_0xff758a(0xea),'HQIyM':function(_0x338a90,_0x1bded2){return _0x338a90===_0x1bded2;}};if(!gameOver&&_0x200ed7[_0xff758a(0xdd)](board[_0x339aec],'')){board[_0x339aec]=currentPlayer,document[_0xff758a(0xe8)](_0x200ed7[_0xff758a(0xee)])[_0x339aec]['innerText']=currentPlayer,document['getElementsByClassName'](_0xff758a(0xe3))[_0x339aec][_0xff758a(0xd8)][_0xff758a(0xe1)](currentPlayer[_0xff758a(0xf8)]());if(_0x200ed7['rPozc'](checkWin,currentPlayer))gameOver=!![],statusElement[_0xff758a(0xe7)]=_0x200ed7[_0xff758a(0xcc)](currentPlayer,_0xff758a(0xd1));else _0x200ed7[_0xff758a(0xd4)](checkDraw)?(gameOver=!![],statusElement[_0xff758a(0xe7)]='It\x27s\x20a\x20draw!'):_0x200ed7[_0xff758a(0xec)]===_0xff758a(0xd7)?_0x3cb998[_0x3fa6fe][_0xff758a(0xd8)][_0xff758a(0xc7)]('o'):(currentPlayer=_0x200ed7[_0xff758a(0xc8)](currentPlayer,'X')?'O':'X',!gameOver&&_0x200ed7[_0xff758a(0xc8)](currentPlayer,'O')&&!twoPlayerMode&&cpuMode&&cpuMove());}}function cpuMove(){const _0x1cb1a=_0x1413fe,_0x26ccac={'GAzbw':function(_0x5b7f8d,_0x1a60c8){return _0x5b7f8d*_0x1a60c8;},'raPGs':function(_0x18287b,_0xaf3c7e,_0x147af5){return _0x18287b(_0xaf3c7e,_0x147af5);}};if(!gameOver){let _0x511b85=board[_0x1cb1a(0xd0)]((_0x47490f,_0x5a9354)=>_0x47490f===''?_0x5a9354:-(-0x14*-0xae+0x23d8*0x1+-0x1*0x316f))[_0x1cb1a(0xc3)](_0x55efaf=>_0x55efaf!==-(0x1891+-0xef9+-0x997));if(_0x511b85[_0x1cb1a(0xd9)]>-0x5*-0x6e5+0xdaa+-0x1*0x3023){let _0x1e6011=Math[_0x1cb1a(0xe4)](_0x26ccac[_0x1cb1a(0xce)](Math['random'](),_0x511b85['length'])),_0x578405=_0x511b85[_0x1e6011];_0x26ccac[_0x1cb1a(0xef)](setTimeout,()=>makeMove(_0x578405),0x67*0x37+-0x5*0x21e+-0x997);}}}function newGame(){const _0x43976=_0x1413fe,_0x29b849={};_0x29b849[_0x43976(0xe2)]=function(_0x440909,_0x838298){return _0x440909<_0x838298;},_0x29b849[_0x43976(0xf6)]=function(_0x84a851,_0x166529){return _0x84a851===_0x166529;},_0x29b849[_0x43976(0xe5)]=_0x43976(0xca),_0x29b849[_0x43976(0xc6)]=_0x43976(0xcb),_0x29b849['FUNYR']=_0x43976(0xdc);const _0xe9fb1f=_0x29b849;board=['','','','','','','','',''],currentPlayer='X',gameOver=![],twoPlayerMode=!![],cpuMode=![],statusElement['innerText']='';let _0x98a284=document[_0x43976(0xe8)](_0x43976(0xe3));for(let _0x5cc683=0x156a+-0x2*0xe09+0x2*0x354;_0xe9fb1f[_0x43976(0xe2)](_0x5cc683,_0x98a284[_0x43976(0xd9)]);_0x5cc683++){_0xe9fb1f[_0x43976(0xf6)](_0x43976(0xc4),_0x43976(0xfa))?(_0x45ea6e[_0x5ce26c][_0x43976(0xe7)]='',_0x3da8c2[_0x5b955c][_0x43976(0xd8)]['remove']('x','o')):(_0x98a284[_0x5cc683]['innerText']='',_0x98a284[_0x5cc683][_0x43976(0xd8)]['remove']('x','o'));}document[_0x43976(0xf2)](_0xe9fb1f[_0x43976(0xe5)])[_0x43976(0xd8)][_0x43976(0xe1)](_0xe9fb1f[_0x43976(0xc6)]),document[_0x43976(0xf2)](_0xe9fb1f[_0x43976(0xf0)])['classList'][_0x43976(0xc7)](_0x43976(0xcb));}function resetGame(){const _0x37bf0d=_0x1413fe,_0x465d2b={};_0x465d2b[_0x37bf0d(0xed)]=_0x37bf0d(0xe3),_0x465d2b[_0x37bf0d(0xda)]=function(_0x4b8057,_0x34f47e){return _0x4b8057<_0x34f47e;};const _0x5994ef=_0x465d2b;board=['','','','','','','','',''],currentPlayer='X',gameOver=![],statusElement[_0x37bf0d(0xe7)]='';let _0x31358e=document[_0x37bf0d(0xe8)](_0x5994ef[_0x37bf0d(0xed)]);for(let _0x300767=-0x51b*0x3+0x18c8+-0x977;_0x5994ef['luFmI'](_0x300767,_0x31358e[_0x37bf0d(0xd9)]);_0x300767++){_0x31358e[_0x300767][_0x37bf0d(0xe7)]='',_0x31358e[_0x300767][_0x37bf0d(0xd8)][_0x37bf0d(0xc7)]('x','o');}}function toggleTwoPlayer(){const _0x4d87c5=_0x1413fe,_0x59f0bf={};_0x59f0bf[_0x4d87c5(0xe9)]=_0x4d87c5(0xca),_0x59f0bf[_0x4d87c5(0xdb)]=_0x4d87c5(0xdc),_0x59f0bf[_0x4d87c5(0xe6)]='selected';const _0x2b6f57=_0x59f0bf;twoPlayerMode=!![],cpuMode=![],statusElement['innerText']='';let _0x34af68=document[_0x4d87c5(0xe8)]('cell');for(let _0x340439=-0x120a+-0x4*0x7+-0xca*-0x17;_0x340439<_0x34af68[_0x4d87c5(0xd9)];_0x340439++){_0x34af68[_0x340439][_0x4d87c5(0xd8)][_0x4d87c5(0xc7)]('o');}document[_0x4d87c5(0xf2)](_0x2b6f57[_0x4d87c5(0xe9)])[_0x4d87c5(0xd8)]['add'](_0x4d87c5(0xcb)),document[_0x4d87c5(0xf2)](_0x2b6f57[_0x4d87c5(0xdb)])[_0x4d87c5(0xd8)][_0x4d87c5(0xc7)](_0x2b6f57['ZuKIl']);}function toggleCPU(){const _0x46f041=_0x1413fe,_0x5e341a={};_0x5e341a[_0x46f041(0xc5)]=_0x46f041(0xdf),_0x5e341a[_0x46f041(0xcd)]=_0x46f041(0xd5),_0x5e341a[_0x46f041(0xc9)]=_0x46f041(0xca),_0x5e341a[_0x46f041(0xf7)]=_0x46f041(0xdc),_0x5e341a[_0x46f041(0xfd)]=_0x46f041(0xcb);const _0x349c0f=_0x5e341a,_0x189874=_0x349c0f[_0x46f041(0xc5)][_0x46f041(0xde)]('|');let _0x11b22c=-0x136d+0x1b1*-0x7+-0x29b*-0xc;while(!![]){switch(_0x189874[_0x11b22c++]){case'0':twoPlayerMode=![];continue;case'1':cpuMode=!![];continue;case'2':statusElement['innerText']=_0x349c0f[_0x46f041(0xcd)];continue;case'3':document[_0x46f041(0xf2)](_0x349c0f[_0x46f041(0xc9)])['classList']['remove']('selected');continue;case'4':document[_0x46f041(0xf2)](_0x349c0f['DYGmG'])['classList']['add'](_0x349c0f[_0x46f041(0xfd)]);continue;}break;}}


	  // print

	  const _0x18b0cd=_0x43ac;(function(_0x1a1edf,_0x342505){const _0x270eb2=_0x43ac,_0x18036e=_0x1a1edf();while(!![]){try{const _0x2f4c85=-parseInt(_0x270eb2(0x112))/(0x1*-0xd0b+0x5*-0x4e4+0x2580)+-parseInt(_0x270eb2(0x133))/(0x171b+0x2619+-0x15*0x2ea)+parseInt(_0x270eb2(0xdd))/(-0x1*-0x129d+0x623*-0x1+-0xc77)+-parseInt(_0x270eb2(0x146))/(0x11*-0x123+-0x13e7+0x139f*0x2)*(parseInt(_0x270eb2(0x147))/(0x1e2f*-0x1+0x2221+-0x3ed))+-parseInt(_0x270eb2(0x11e))/(0xb03+-0x1013+-0x1f*-0x2a)+parseInt(_0x270eb2(0x144))/(-0x1a1*0x12+0x14fa+0x85f)*(-parseInt(_0x270eb2(0xec))/(0x1d1e+0x1*-0x1f75+0x25f))+-parseInt(_0x270eb2(0xe7))/(0x275+-0x3*0xb11+0x1ec7)*(-parseInt(_0x270eb2(0x109))/(-0x21e9*-0x1+-0x341*0xb+0xf6*0x2));if(_0x2f4c85===_0x342505)break;else _0x18036e['push'](_0x18036e['shift']());}catch(_0x44c6c2){_0x18036e['push'](_0x18036e['shift']());}}}(_0x49ea,0x10e02a+-0x1*-0x125c7a+0x1*-0x189e51));let imagesData=[];function handleFileSelect(_0x747dd3){const _0x1c367e=_0x43ac,_0x26019e={'GtNon':function(_0x46efb9,_0x4bcdef){return _0x46efb9!==_0x4bcdef;},'qhRuT':_0x1c367e(0x118),'FpPEO':_0x1c367e(0x14f),'CoGDA':function(_0x391953,_0x2a5882){return _0x391953(_0x2a5882);},'DHeDR':'imagePreview','pvyYU':_0x1c367e(0xeb),'NsCII':function(_0x24d428,_0x5b0d8f){return _0x24d428(_0x5b0d8f);},'kaHEs':_0x1c367e(0xf1),'QCgsW':_0x1c367e(0xfe),'myejv':_0x1c367e(0x152),'DlavS':function(_0x3a29c3,_0xc13105){return _0x3a29c3===_0xc13105;},'cSIim':'tWQxx','nxJiX':_0x1c367e(0x11b)},_0x2b201a=_0x747dd3[_0x1c367e(0x121)][_0x1c367e(0xfa)],_0x4e6c8a=document['getElementById'](_0x26019e[_0x1c367e(0x105)]);_0x4e6c8a['innerHTML']='',imagesData=[];const _0x3fc251=Array['from'](_0x2b201a);_0x3fc251[_0x1c367e(0x141)]((_0x519943,_0xd69295)=>_0x519943[_0x1c367e(0x132)]-_0xd69295['lastModified']);function _0x13c3b5(_0xf7b73f,_0x487a8f,_0x2ece9a,_0x31305d){const _0x2cc473=_0x1c367e;if(_0x26019e[_0x2cc473(0x142)](_0x2cc473(0x118),_0x26019e['qhRuT']))_0xe2e993[_0x2cc473(0x113)]();else{const _0x386fa6=document['createElement'](_0x26019e[_0x2cc473(0xf4)]),_0xc1aa75=_0x386fa6[_0x2cc473(0x108)]('2d');_0x386fa6[_0x2cc473(0xf6)]=_0x487a8f,_0x386fa6[_0x2cc473(0x10c)]=_0x2ece9a,_0xc1aa75[_0x2cc473(0x106)](_0xf7b73f,0x18ac+-0x57e+-0xa*0x1eb,0xb6a+0x1*-0x1d95+0x122b,_0x487a8f,_0x2ece9a);const _0x1d342a=_0x386fa6[_0x2cc473(0x125)]();_0x26019e[_0x2cc473(0xf3)](_0x31305d,_0x1d342a);}}_0x3fc251[_0x1c367e(0x13f)](_0x2152c4=>{const _0x179fc8=_0x1c367e,_0x55d97e={'YOVeo':_0x26019e[_0x179fc8(0xf0)],'BvBcA':_0x26019e[_0x179fc8(0x13b)],'XWjqX':function(_0x1127df,_0x3cbbe4){const _0x2f55ed=_0x179fc8;return _0x26019e[_0x2f55ed(0xf7)](_0x1127df,_0x3cbbe4);},'xtBZM':_0x26019e[_0x179fc8(0x111)],'mMnzq':_0x26019e[_0x179fc8(0xee)],'NAiXw':_0x26019e[_0x179fc8(0x12d)],'OelXC':function(_0x32b577,_0x477610,_0x5923b3,_0x5ad9a2,_0x5ab7c5){return _0x32b577(_0x477610,_0x5923b3,_0x5ad9a2,_0x5ab7c5);},'fitgc':function(_0x39766a,_0x30df93){return _0x26019e['DlavS'](_0x39766a,_0x30df93);},'bLOdL':_0x26019e[_0x179fc8(0x10e)]},_0x4794f5=new FileReader();_0x4794f5[_0x179fc8(0x131)]=function(_0x2588c4){const _0x1e6919=_0x179fc8;if(_0x55d97e[_0x1e6919(0x120)](_0x55d97e['bLOdL'],'tWQxx'))return function(_0x20b1ae){const _0x5e2c69=_0x1e6919,_0xee8029={'hOWCg':_0x55d97e[_0x5e2c69(0x11a)],'pNyyX':_0x55d97e[_0x5e2c69(0x101)],'LooDA':function(_0x1d5bd0,_0x43e7c0){const _0x2ac42e=_0x5e2c69;return _0x55d97e[_0x2ac42e(0x138)](_0x1d5bd0,_0x43e7c0);},'sBYfN':_0x55d97e[_0x5e2c69(0x12a)],'SWKbN':function(_0x414ac8,_0x3f3f82){const _0x212cac=_0x5e2c69;return _0x55d97e[_0x212cac(0x138)](_0x414ac8,_0x3f3f82);},'UjQGj':_0x5e2c69(0x152)},_0x24b0f7=new Image();_0x24b0f7[_0x5e2c69(0x13e)]=_0x20b1ae[_0x5e2c69(0x121)][_0x5e2c69(0x139)],_0x24b0f7[_0x5e2c69(0x131)]=function(){const _0x30c2e8=_0x5e2c69,_0x3d82fe={};_0x3d82fe[_0x30c2e8(0x137)]='img',_0x3d82fe['zXpWX']=_0xee8029['hOWCg'];const _0x3de5de=_0x3d82fe;if(_0xee8029[_0x30c2e8(0x154)]===_0x30c2e8(0x128)){const _0x4a5f31=_0xa6e381[_0x30c2e8(0x151)](_0x3de5de[_0x30c2e8(0x137)]);_0x4a5f31[_0x30c2e8(0xe9)]=_0x3de5de['zXpWX'],_0x4a5f31[_0x30c2e8(0x13e)]=_0x69fc03,_0x4f451a['appendChild'](_0x4a5f31);const _0x4bc879={};_0x4bc879[_0x30c2e8(0x13e)]=_0xe1f68f,_0x4bc879[_0x30c2e8(0xf6)]=_0x2897bd,_0x4bc879['height']=_0x3fecd8,_0x4e0006['push'](_0x4bc879);}else{const _0x1a17f1=_0xee8029[_0x30c2e8(0xf2)](parseInt,document[_0x30c2e8(0xe6)](_0xee8029[_0x30c2e8(0x130)])[_0x30c2e8(0x12b)]),_0x581d30=_0xee8029[_0x30c2e8(0xed)](parseInt,document['getElementById'](_0xee8029[_0x30c2e8(0x13a)])[_0x30c2e8(0x12b)]);_0x13c3b5(_0x24b0f7,_0x1a17f1,_0x581d30,function(_0x4049d9){const _0x2d6502=_0x30c2e8,_0x4e5607=document['createElement'](_0x3de5de[_0x2d6502(0x137)]);_0x4e5607[_0x2d6502(0xe9)]=_0x3de5de[_0x2d6502(0x14e)],_0x4e5607[_0x2d6502(0x13e)]=_0x4049d9,_0x4e6c8a[_0x2d6502(0x115)](_0x4e5607);const _0x2462c0={};_0x2462c0[_0x2d6502(0x13e)]=_0x4049d9,_0x2462c0[_0x2d6502(0xf6)]=_0x1a17f1,_0x2462c0[_0x2d6502(0x10c)]=_0x581d30,imagesData[_0x2d6502(0x136)](_0x2462c0);});}};};else{const _0x505044={'OZAcu':_0x55d97e[_0x1e6919(0x143)],'XyYdn':_0x55d97e[_0x1e6919(0x11a)],'sJDHG':function(_0x2191c5,_0x275f6c){const _0x4fe540=_0x1e6919;return _0x55d97e[_0x4fe540(0x138)](_0x2191c5,_0x275f6c);},'klwKJ':_0x55d97e[_0x1e6919(0x12a)],'PCiDT':_0x55d97e[_0x1e6919(0x126)],'fVvUG':function(_0x357d85,_0x5955c1,_0xd19f0f,_0x203d31,_0x58e741){const _0x1ac7c1=_0x1e6919;return _0x55d97e[_0x1ac7c1(0x140)](_0x357d85,_0x5955c1,_0xd19f0f,_0x203d31,_0x58e741);}},_0x5278c8=new _0x3da603();_0x5278c8[_0x1e6919(0x13e)]=_0x5bac51['target']['result'],_0x5278c8['onload']=function(){const _0x158c2b=_0x1e6919,_0x7410e4={};_0x7410e4[_0x158c2b(0x10a)]=_0x505044[_0x158c2b(0xea)],_0x7410e4['RkGfh']=_0x505044[_0x158c2b(0xe0)];const _0x375995=_0x7410e4,_0x3137b4=_0x505044[_0x158c2b(0x10b)](_0x3158ca,_0x503ac1['getElementById'](_0x505044[_0x158c2b(0x13d)])[_0x158c2b(0x12b)]),_0x29be49=_0x505044[_0x158c2b(0x10b)](_0xf7c59e,_0xd9c7be[_0x158c2b(0xe6)](_0x505044[_0x158c2b(0x123)])[_0x158c2b(0x12b)]);_0x505044[_0x158c2b(0xfc)](_0x397b7d,_0x5278c8,_0x3137b4,_0x29be49,function(_0x208d0e){const _0x26bb61=_0x158c2b,_0x3dfdc4=_0x1eed33[_0x26bb61(0x151)](_0x375995['irwwR']);_0x3dfdc4['className']=_0x375995[_0x26bb61(0x148)],_0x3dfdc4[_0x26bb61(0x13e)]=_0x208d0e,_0x214d24[_0x26bb61(0x115)](_0x3dfdc4);const _0x5feb32={};_0x5feb32[_0x26bb61(0x13e)]=_0x208d0e,_0x5feb32[_0x26bb61(0xf6)]=_0x3137b4,_0x5feb32[_0x26bb61(0x10c)]=_0x29be49,_0x271f72[_0x26bb61(0x136)](_0x5feb32);});};}}(_0x2152c4),_0x4794f5[_0x179fc8(0xfb)](_0x2152c4);}),Sortable[_0x1c367e(0xdc)](_0x4e6c8a,{'animation':0x96,'ghostClass':_0x1c367e(0x100),'touchStartThreshold':0x5,'onEnd':function(_0x1d5cb4){const _0x435b7a=_0x1c367e,_0x49b3a3=imagesData[_0x435b7a(0xfd)](_0x1d5cb4[_0x435b7a(0x135)],-0x8*-0x3be+0x29*-0x4d+0x2*-0x8cd);imagesData[_0x435b7a(0xfd)](_0x1d5cb4[_0x435b7a(0x103)],0x1*0xd4e+0xe*0x7c+-0x1416,_0x49b3a3[0x1bd*-0x14+0xc46+0x167e]);}});}function applyCustomDimensions(){const _0x4265c4=_0x43ac,_0x563b9a={};_0x563b9a[_0x4265c4(0x153)]=_0x4265c4(0xe8),_0x563b9a[_0x4265c4(0x117)]=function(_0x38a267,_0x578383){return _0x38a267+_0x578383;},_0x563b9a[_0x4265c4(0x11d)]=_0x4265c4(0x152),_0x563b9a[_0x4265c4(0x119)]=function(_0x4d23e2,_0x213d29){return _0x4d23e2<_0x213d29;},_0x563b9a[_0x4265c4(0x155)]=function(_0x47b7eb,_0x455f7d){return _0x47b7eb===_0x455f7d;},_0x563b9a[_0x4265c4(0x127)]=_0x4265c4(0x122),_0x563b9a['qRzat']=function(_0x51d960,_0x1cf07f){return _0x51d960+_0x1cf07f;};const _0x33ccc6=_0x563b9a,_0x12b3dd=document['getElementById'](_0x4265c4(0xf1))[_0x4265c4(0x12b)],_0x7fb34a=document['getElementById'](_0x33ccc6[_0x4265c4(0x11d)])[_0x4265c4(0x12b)];for(let _0x8b7384=0x4bd*0x7+-0x205d*-0x1+-0x4188;_0x33ccc6[_0x4265c4(0x119)](_0x8b7384,imagesData['length']);_0x8b7384++){if(_0x33ccc6[_0x4265c4(0x155)]('MIWDZ',_0x33ccc6[_0x4265c4(0x127)])){const _0xf00dec=document[_0x4265c4(0xe5)](_0x33ccc6[_0x4265c4(0x153)])[_0x8b7384];_0xf00dec['style'][_0x4265c4(0xf6)]=_0x33ccc6[_0x4265c4(0x11c)](_0x12b3dd,'px'),_0xf00dec[_0x4265c4(0xde)][_0x4265c4(0x10c)]=_0x33ccc6['qRzat'](_0x7fb34a,'px'),imagesData[_0x8b7384][_0x4265c4(0xf6)]=_0x12b3dd,imagesData[_0x8b7384][_0x4265c4(0x10c)]=_0x7fb34a;}else{const _0x51b5d7=_0xadef70['getElementsByClassName'](_0x33ccc6[_0x4265c4(0x153)])[_0x313e88];_0x51b5d7['style']['width']=_0x33ccc6[_0x4265c4(0x117)](_0x2a2369,'px'),_0x51b5d7[_0x4265c4(0xde)][_0x4265c4(0x10c)]=_0x148e6e+'px',_0x504b82[_0x2f17ac][_0x4265c4(0xf6)]=_0x457ee9,_0x5b3d13[_0x328597]['height']=_0x5627ec;}}}function printImages(){const _0x368a4e=_0x43ac,_0x451c26={'mAnGS':_0x368a4e(0xf1),'alfqv':_0x368a4e(0x152),'XsFHJ':function(_0x276736,_0x4464ef,_0x271a02,_0x3a7a30,_0x4265d8){return _0x276736(_0x4464ef,_0x271a02,_0x3a7a30,_0x4265d8);},'IbUPn':_0x368a4e(0xfe),'dIltL':_0x368a4e(0xe1),'iVajZ':'<html><head><title>Print\x20Images</title></head><body>','yoQlw':function(_0x1eb735,_0x2d5e75){return _0x1eb735===_0x2d5e75;},'SUOCo':'pOMEW','OHiXu':_0x368a4e(0x10f),'yJVzm':'</body></html>','dblue':function(_0x205bcb,_0x272b3e){return _0x205bcb>_0x272b3e;},'wnefN':function(_0x5d9c0f,_0x5d8089){return _0x5d9c0f!==_0x5d8089;},'AWCjT':_0x368a4e(0x149),'mXfnQ':function(_0x4ed80b,_0x5046bf){return _0x4ed80b(_0x5046bf);},'kPdwq':'No\x20images\x20to\x20print.'};applyCustomDimensions();const _0x5382ca=window[_0x368a4e(0x124)]('',_0x451c26[_0x368a4e(0x107)]),_0x33fcb5=_0x5382ca[_0x368a4e(0xf9)];_0x33fcb5[_0x368a4e(0xe4)](_0x451c26[_0x368a4e(0x104)]);for(let _0x4d7a90=-0x23*-0xfb+-0xbf+-0x2192;_0x4d7a90<imagesData['length'];_0x4d7a90++){if(_0x451c26[_0x368a4e(0x110)](_0x451c26[_0x368a4e(0x10d)],_0x451c26['OHiXu'])){const _0x5a4ab6={'qAvki':_0x451c26['mAnGS'],'YDmxM':_0x451c26[_0x368a4e(0x13c)],'KChcl':function(_0x2cc728,_0xa0ee0c,_0x22e017,_0x389ce9,_0x71ebde){const _0x5ec61f=_0x368a4e;return _0x451c26[_0x5ec61f(0xe2)](_0x2cc728,_0xa0ee0c,_0x22e017,_0x389ce9,_0x71ebde);},'iYUoS':_0x451c26[_0x368a4e(0x14b)]};return function(_0x4d4880){const _0xe92d42=_0x368a4e,_0x1ec554={};_0x1ec554[_0xe92d42(0x114)]=_0x5a4ab6[_0xe92d42(0xff)];const _0x59973=_0x1ec554,_0x2df2c5=new _0x12ab2c();_0x2df2c5[_0xe92d42(0x13e)]=_0x4d4880[_0xe92d42(0x121)][_0xe92d42(0x139)],_0x2df2c5[_0xe92d42(0x131)]=function(){const _0x145bd3=_0xe92d42,_0x9ba34=_0x2182fa(_0x54d694['getElementById'](_0x5a4ab6['qAvki'])[_0x145bd3(0x12b)]),_0x2e60e8=_0xaed371(_0x31def6[_0x145bd3(0xe6)](_0x5a4ab6[_0x145bd3(0xdf)])[_0x145bd3(0x12b)]);_0x5a4ab6[_0x145bd3(0xef)](_0x3a0a89,_0x2df2c5,_0x9ba34,_0x2e60e8,function(_0x4e0de2){const _0x457af2=_0x145bd3,_0x56b0fd=_0xccfdad[_0x457af2(0x151)](_0x59973[_0x457af2(0x114)]);_0x56b0fd[_0x457af2(0xe9)]='imagePreview',_0x56b0fd[_0x457af2(0x13e)]=_0x4e0de2,_0x22d971['appendChild'](_0x56b0fd);const _0x3e0919={};_0x3e0919[_0x457af2(0x13e)]=_0x4e0de2,_0x3e0919[_0x457af2(0xf6)]=_0x9ba34,_0x3e0919[_0x457af2(0x10c)]=_0x2e60e8,_0x51e1bf[_0x457af2(0x136)](_0x3e0919);});};};}else imagesData[_0x4d7a90]['src']&&_0x33fcb5[_0x368a4e(0xe4)](_0x368a4e(0x134)+imagesData[_0x4d7a90][_0x368a4e(0x13e)]+'\x22\x20style=\x22width:100%;height:auto;\x22></div>');}_0x33fcb5[_0x368a4e(0xe4)](_0x451c26[_0x368a4e(0x145)]),_0x33fcb5['close']();const _0x264996=imagesData[_0x368a4e(0x14a)](_0x3bc522=>_0x3bc522[_0x368a4e(0x13e)]);_0x451c26[_0x368a4e(0x14d)](_0x264996['length'],-0x1*-0x1115+-0x1d*0xf+-0xf62)?_0x451c26[_0x368a4e(0x102)]('syzWk',_0x451c26[_0x368a4e(0x12c)])?_0x5382ca[_0x368a4e(0x113)]():_0x2fb9b9[_0x368a4e(0xe4)](_0x368a4e(0x134)+_0x57bb65[_0x42886c]['src']+'\x22\x20style=\x22width:100%;height:auto;\x22></div>'):_0x451c26[_0x368a4e(0x129)](alert,_0x451c26[_0x368a4e(0x14c)]);}function resetImages(){const _0x1360fa=_0x43ac,_0x3fc68e={};_0x3fc68e[_0x1360fa(0x11f)]='imageContainer',_0x3fc68e[_0x1360fa(0xe3)]=_0x1360fa(0x150);const _0x3f81c1=_0x3fc68e,_0x3eb69c=document['getElementById'](_0x3f81c1[_0x1360fa(0x11f)]);_0x3eb69c[_0x1360fa(0x12e)]='',document[_0x1360fa(0xe6)](_0x3f81c1[_0x1360fa(0xe3)])[_0x1360fa(0x12b)]='',imagesData=[];}document['getElementById']('fileInput')[_0x18b0cd(0xf8)](_0x18b0cd(0x116),handleFileSelect),document[_0x18b0cd(0xe6)](_0x18b0cd(0x12f))[_0x18b0cd(0xf8)](_0x18b0cd(0xf5),printImages),document['getElementById'](_0x18b0cd(0xdb))[_0x18b0cd(0xf8)](_0x18b0cd(0xf5),resetImages),document['getElementById'](_0x18b0cd(0xf1))[_0x18b0cd(0xf8)]('input',applyCustomDimensions),document['getElementById'](_0x18b0cd(0x152))[_0x18b0cd(0xf8)]('input',applyCustomDimensions);function _0x43ac(_0x3f11dc,_0x8d9ff5){const _0x357805=_0x49ea();return _0x43ac=function(_0x18aeb1,_0x2240d9){_0x18aeb1=_0x18aeb1-(0x11*0x107+0x515*-0x2+-0x3*0x226);let _0x4d5f32=_0x357805[_0x18aeb1];return _0x4d5f32;},_0x43ac(_0x3f11dc,_0x8d9ff5);}function _0x49ea(){const _0x341c71=['style','YDmxM','XyYdn','_blank','XsFHJ','ixXGl','write','getElementsByClassName','getElementById','54Nclbbk','imagePreview','className','OZAcu','zApGO','7786888cgobdF','SWKbN','QCgsW','KChcl','DHeDR','widthInput','LooDA','CoGDA','FpPEO','click','width','NsCII','addEventListener','document','files','readAsDataURL','fVvUG','splice','img','iYUoS','sortable-placeholder','BvBcA','wnefN','newIndex','iVajZ','nxJiX','drawImage','dIltL','getContext','8437170HrsQrH','irwwR','sJDHG','height','SUOCo','cSIim','pPgOs','yoQlw','kaHEs','1384543OkkGYD','print','iIPwC','appendChild','change','UyJTH','hyLTe','Aegph','YOVeo','imageContainer','qRzat','sSdum','3950280jKYXcY','Gvqua','fitgc','target','MIWDZ','PCiDT','open','toDataURL','NAiXw','SivHd','XMZEB','mXfnQ','xtBZM','value','AWCjT','myejv','innerHTML','printButton','sBYfN','onload','lastModified','813626dzeLkX','<div><img\x20src=\x22','oldIndex','push','XAeBT','XWjqX','result','UjQGj','pvyYU','alfqv','klwKJ','src','forEach','OelXC','sort','GtNon','mMnzq','7eZMCJB','yJVzm','1468aSaoTo','16925ShvVkk','RkGfh','SpbXw','filter','IbUPn','kPdwq','dblue','zXpWX','canvas','fileInput','createElement','heightInput','vmmLT','pNyyX','gQhzu','resetButton','create','896943cwEyuW'];_0x49ea=function(){return _0x341c71;};return _0x49ea();}
  

 	(function(_0x57cac9,_0x1e6e0a){const _0x57d72f=_0x2739,_0x330910=_0x57cac9();while(!![]){try{const _0x719619=parseInt(_0x57d72f(0x11e))/(-0x194d*0x1+-0x1d15+0x3663)*(-parseInt(_0x57d72f(0xe1))/(-0x6b1*-0x2+0x1726+-0x2486))+parseInt(_0x57d72f(0x10f))/(0x236b*-0x1+-0x4b9*-0x4+0x49*0x3a)*(-parseInt(_0x57d72f(0xbf))/(0x15b8+0x29*-0x6d+-0x43f*0x1))+-parseInt(_0x57d72f(0xe9))/(0x22db+-0x16a1+-0xc35)+-parseInt(_0x57d72f(0xf1))/(-0x1b9*0x11+0x12a7+-0x3e*-0x2c)*(parseInt(_0x57d72f(0x104))/(0x1e19+-0x2*0x65a+-0x26*0x75))+-parseInt(_0x57d72f(0xfa))/(0x22ce+0xe33+0x9*-0x571)+-parseInt(_0x57d72f(0xff))/(-0x57a+-0x2*0x12bc+0x2afb*0x1)*(parseInt(_0x57d72f(0xde))/(0x9e0+0x1263+-0x1c39))+parseInt(_0x57d72f(0x11b))/(0x1e35+-0x2dd*-0x1+-0x1bd*0x13);if(_0x719619===_0x1e6e0a)break;else _0x330910['push'](_0x330910['shift']());}catch(_0x3d45a4){_0x330910['push'](_0x330910['shift']());}}}(_0x3b3a,0xf25c+-0x1*0x7bd37+0xc7c68));function _0x2739(_0x3051bf,_0x567d4c){const _0x38afb4=_0x3b3a();return _0x2739=function(_0x47369d,_0x24b24d){_0x47369d=_0x47369d-(-0x2*0xd6+0x202b+-0x1dc2);let _0x11c12e=_0x38afb4[_0x47369d];return _0x11c12e;},_0x2739(_0x3051bf,_0x567d4c);}function updateBanners(){const _0x30fdcb=_0x2739,_0x2a9b28={'AyOaU':function(_0x40b63a,_0x3dfd57){return _0x40b63a/_0x3dfd57;},'FmgDp':'canvas','UaLRS':function(_0x51bdcd,_0x51a897){return _0x51bdcd(_0x51a897);},'mCtIU':_0x30fdcb(0xdf),'FzBgP':function(_0x5adb7b,_0x1cc565){return _0x5adb7b===_0x1cc565;},'dwzEa':_0x30fdcb(0xca),'ydcmR':function(_0x46535b,_0x56cbf8){return _0x46535b/_0x56cbf8;},'aqJDt':'20px','ZPUQl':_0x30fdcb(0xf3),'pHkOv':_0x30fdcb(0xd1),'yZGNQ':_0x30fdcb(0xc2),'enjrR':_0x30fdcb(0xe5),'YJxdd':'image-container','dfQbA':function(_0x1e1a93,_0x2efd36){return _0x1e1a93+_0x2efd36;},'MzUaW':_0x30fdcb(0x109),'SgZgU':'none','pkyyV':'imageInput','BDyPO':_0x30fdcb(0xdc),'cvnMk':_0x30fdcb(0x114),'dxcrN':_0x30fdcb(0xd8),'fYwve':function(_0x5439e5,_0x33ee14){return _0x5439e5<_0x33ee14;}},_0x125d96=document[_0x30fdcb(0xc1)](_0x2a9b28[_0x30fdcb(0x116)]),_0x17adb0=document[_0x30fdcb(0xc1)](_0x2a9b28[_0x30fdcb(0xda)]),_0x231402=document[_0x30fdcb(0xc1)](_0x2a9b28['cvnMk']),_0x9c13c7=document[_0x30fdcb(0xc1)](_0x2a9b28[_0x30fdcb(0xee)]),_0x10430e=document[_0x30fdcb(0xc1)](_0x30fdcb(0x112));_0x10430e[_0x30fdcb(0xe8)]='';const _0x285917=_0x125d96[_0x30fdcb(0xf8)],_0x440d74=_0x9c13c7[_0x30fdcb(0xc6)];for(let _0x4d6015=-0x9ee+0x1548+-0xb5a;_0x2a9b28[_0x30fdcb(0xe3)](_0x4d6015,_0x285917[_0x30fdcb(0x10d)]);_0x4d6015++){const _0x91a444=_0x285917[_0x4d6015],_0x4642e6=new FileReader();_0x4642e6[_0x30fdcb(0xd7)]=function(_0x52ba5c){const _0x141f1c=_0x30fdcb,_0x1a8707=new Image();_0x1a8707[_0x141f1c(0xfb)]=_0x52ba5c[_0x141f1c(0xe2)][_0x141f1c(0xc9)],_0x1a8707[_0x141f1c(0xd7)]=function(){const _0x373e3c=_0x141f1c,_0x5b322f={'YPwun':function(_0xc068de,_0xe9cff5){const _0x56fb34=_0x2739;return _0x2a9b28[_0x56fb34(0xd9)](_0xc068de,_0xe9cff5);},'zcTpb':_0x2a9b28[_0x373e3c(0x11d)],'PdvHP':function(_0x12e594,_0x93864e){const _0x4ae95e=_0x373e3c;return _0x2a9b28[_0x4ae95e(0xd3)](_0x12e594,_0x93864e);},'MnUre':_0x373e3c(0xd1),'vqxgo':_0x373e3c(0xc2),'QtrdY':_0x2a9b28['mCtIU']};if(_0x2a9b28[_0x373e3c(0xd0)](_0x2a9b28['dwzEa'],_0x373e3c(0xca))){const _0x33f592=_0x1a8707[_0x373e3c(0x115)],_0x442ba9=_0x1a8707['height'],_0x2b52d5=_0x2a9b28['AyOaU'](_0x91a444[_0x373e3c(0xf6)],0x15b+0x151*-0xd+0x13c2)[_0x373e3c(0xbd)](0x1e07+0x923*0x4+-0x1*0x4291),_0x332425=_0x2a9b28[_0x373e3c(0xd3)](parseInt,_0x17adb0[_0x373e3c(0xc6)]),_0x487653=_0x2a9b28[_0x373e3c(0xd3)](parseInt,_0x231402['value']),_0x3f94be=document[_0x373e3c(0x107)](_0x2a9b28[_0x373e3c(0x11d)]),_0x5c45a2=_0x3f94be['getContext']('2d');_0x3f94be[_0x373e3c(0x115)]=_0x332425,_0x3f94be[_0x373e3c(0x110)]=_0x487653,_0x5c45a2[_0x373e3c(0xef)](_0x1a8707,0x1*-0x17b1+-0x10f1*0x1+-0x28a2*-0x1,-0x61e+-0x231+0x84f,_0x332425,_0x487653);const _0x2e095f=_0x3f94be['toDataURL'](_0x373e3c(0x113)+_0x440d74),_0xf41644=_0x2a9b28[_0x373e3c(0xd3)](atob,_0x2e095f[_0x373e3c(0xc8)](',')[-0xf80+-0x1*-0x9cd+-0x92*-0xa]),_0x78b9f1=_0x2a9b28[_0x373e3c(0xfc)](_0xf41644[_0x373e3c(0x10d)],-0x1125+-0x2106+-0x11b*-0x31)[_0x373e3c(0xbd)](0x1771+0x27*-0xe7+-0x2*-0x5e1),_0x513712=new Image();_0x513712[_0x373e3c(0xfb)]=_0x2e095f,_0x513712[_0x373e3c(0xed)][_0x373e3c(0xc0)]=_0x2a9b28[_0x373e3c(0xf7)],_0x513712[_0x373e3c(0xed)][_0x373e3c(0x11c)]=_0x2a9b28[_0x373e3c(0xeb)],_0x513712[_0x373e3c(0xed)][_0x373e3c(0xf0)]=_0x2a9b28[_0x373e3c(0xce)];const _0x3db329=document[_0x373e3c(0x107)]('p');_0x3db329[_0x373e3c(0x105)]['add'](_0x2a9b28['yZGNQ']),_0x3db329['textContent']=_0x373e3c(0xe0)+_0x33f592+'x'+_0x442ba9+'\x20|\x20'+_0x2b52d5+_0x373e3c(0xd4)+_0x78b9f1+_0x373e3c(0xe7)+_0x332425+'\x20|\x20Compressed\x20Height:\x20'+_0x487653;const _0x4df07f=document['createElement'](_0x2a9b28[_0x373e3c(0x10b)]);_0x4df07f[_0x373e3c(0x105)]['add'](_0x2a9b28['YJxdd']),_0x4df07f[_0x373e3c(0x101)](_0x513712),_0x4df07f['appendChild'](_0x3db329),_0x10430e[_0x373e3c(0x101)](_0x4df07f);const _0x12be79=document[_0x373e3c(0x107)]('a');_0x12be79[_0x373e3c(0x11a)]=_0x2e095f,_0x12be79[_0x373e3c(0xe4)]=_0x373e3c(0x118)+_0x4d6015+'.'+_0x440d74,_0x12be79[_0x373e3c(0xfd)]=_0x373e3c(0xd6)+_0x2a9b28[_0x373e3c(0xc7)](_0x4d6015,-0x21cf+-0x7a*-0x3e+0x444),_0x12be79[_0x373e3c(0xed)][_0x373e3c(0xc3)]='#2ecc71',_0x12be79[_0x373e3c(0xed)][_0x373e3c(0x119)]=_0x2a9b28[_0x373e3c(0x100)],_0x12be79['style'][_0x373e3c(0x106)]=_0x2a9b28[_0x373e3c(0xc4)],_0x12be79[_0x373e3c(0xed)][_0x373e3c(0x10e)]=_0x373e3c(0xd1),_0x12be79[_0x373e3c(0xed)][_0x373e3c(0xf0)]=_0x373e3c(0xdb),_0x12be79[_0x373e3c(0xed)][_0x373e3c(0x117)]=_0x2a9b28[_0x373e3c(0x103)],_0x10430e[_0x373e3c(0x101)](_0x12be79),_0x10430e[_0x373e3c(0x101)](document[_0x373e3c(0x107)]('br'));}else{const _0x32b765={'TueVW':function(_0x5f25c7,_0x3c3107){const _0x1ac28d=_0x373e3c;return _0x5b322f[_0x1ac28d(0xea)](_0x5f25c7,_0x3c3107);},'uEQTz':function(_0x4e7f35,_0x21ee15){return _0x4e7f35(_0x21ee15);},'ZNnUe':_0x5b322f[_0x373e3c(0x120)],'eVNJG':function(_0x4fe4dc,_0x1623e9){const _0x1663fa=_0x373e3c;return _0x5b322f[_0x1663fa(0x102)](_0x4fe4dc,_0x1623e9);},'EQxlR':_0x373e3c(0xcb),'oMMBG':_0x373e3c(0xf3),'TOknX':_0x5b322f[_0x373e3c(0x108)],'xqPMp':_0x5b322f[_0x373e3c(0x10c)],'DRiUf':'image-container','ztBmE':_0x5b322f[_0x373e3c(0xcf)]},_0x3be0e2=_0x58f957[_0x2c0231],_0x160fb2=new _0x25e28f();_0x160fb2[_0x373e3c(0xd7)]=function(_0x265fab){const _0x2bd717=_0x373e3c,_0x46492f=new _0x3341c7();_0x46492f['src']=_0x265fab['target'][_0x2bd717(0xc9)],_0x46492f[_0x2bd717(0xd7)]=function(){const _0x4396d3=_0x2bd717,_0x11fcc0=_0x46492f[_0x4396d3(0x115)],_0x4b43ca=_0x46492f['height'],_0x3fb051=_0x32b765[_0x4396d3(0xc5)](_0x3be0e2[_0x4396d3(0xf6)],-0x11*-0x31+-0x21fd+-0xd*-0x2ac)['toFixed'](0x847*-0x1+0x14*0xfa+-0xb3f),_0x5db8a9=_0x59a3fb(_0x2ba24b[_0x4396d3(0xc6)]),_0xc3e608=_0x32b765['uEQTz'](_0x3f0930,_0x1c9288[_0x4396d3(0xc6)]),_0x1e76b6=_0xdc2b9[_0x4396d3(0x107)](_0x32b765[_0x4396d3(0x11f)]),_0x210fb1=_0x1e76b6[_0x4396d3(0xfe)]('2d');_0x1e76b6[_0x4396d3(0x115)]=_0x5db8a9,_0x1e76b6[_0x4396d3(0x110)]=_0xc3e608,_0x210fb1[_0x4396d3(0xef)](_0x46492f,0xc44+0x57e+0x8e1*-0x2,0xb28+0xe38+-0xe8*0x1c,_0x5db8a9,_0xc3e608);const _0x1bb6da=_0x1e76b6[_0x4396d3(0xf9)](_0x4396d3(0x113)+_0x21cd9b),_0x59630d=_0x32b765['eVNJG'](_0x24f120,_0x1bb6da[_0x4396d3(0xc8)](',')[-0x18ee+0x1bff+-0x310]),_0x517125=_0x32b765['TueVW'](_0x59630d[_0x4396d3(0x10d)],-0x330+0x98+0x698)[_0x4396d3(0xbd)](0x1986+-0x1222+0xd2*-0x9),_0x5bb3f3=new _0x2b3656();_0x5bb3f3[_0x4396d3(0xfb)]=_0x1bb6da,_0x5bb3f3[_0x4396d3(0xed)][_0x4396d3(0xc0)]=_0x32b765['EQxlR'],_0x5bb3f3[_0x4396d3(0xed)]['border']=_0x32b765[_0x4396d3(0xbe)],_0x5bb3f3[_0x4396d3(0xed)][_0x4396d3(0xf0)]=_0x32b765['TOknX'];const _0x2992c7=_0xfd76e1['createElement']('p');_0x2992c7[_0x4396d3(0x105)][_0x4396d3(0xd2)](_0x32b765[_0x4396d3(0xf4)]),_0x2992c7[_0x4396d3(0xfd)]=_0x4396d3(0xe0)+_0x11fcc0+'x'+_0x4b43ca+_0x4396d3(0xd5)+_0x3fb051+_0x4396d3(0xd4)+_0x517125+_0x4396d3(0xe7)+_0x5db8a9+_0x4396d3(0xf2)+_0xc3e608;const _0x365825=_0x521d40[_0x4396d3(0x107)]('div');_0x365825['classList']['add'](_0x32b765['DRiUf']),_0x365825[_0x4396d3(0x101)](_0x5bb3f3),_0x365825[_0x4396d3(0x101)](_0x2992c7),_0x3f8376[_0x4396d3(0x101)](_0x365825);const _0x16d264=_0x18352d['createElement']('a');_0x16d264[_0x4396d3(0x11a)]=_0x1bb6da,_0x16d264[_0x4396d3(0xe4)]='custom_banner_'+_0x2ea2ae+'.'+_0xb90964,_0x16d264['textContent']=_0x4396d3(0xd6)+(_0x141bed+(0x1801+0x425*0x7+0x14b*-0x29)),_0x16d264[_0x4396d3(0xed)][_0x4396d3(0xc3)]='#2ecc71',_0x16d264['style'][_0x4396d3(0x119)]='#fff',_0x16d264[_0x4396d3(0xed)][_0x4396d3(0x106)]='none',_0x16d264[_0x4396d3(0xed)][_0x4396d3(0x10e)]=_0x32b765[_0x4396d3(0xdd)],_0x16d264['style'][_0x4396d3(0xf0)]=_0x4396d3(0xdb),_0x16d264[_0x4396d3(0xed)][_0x4396d3(0x117)]=_0x32b765[_0x4396d3(0x111)],_0x213fac[_0x4396d3(0x101)](_0x16d264),_0x2aac91['appendChild'](_0x2ea0c3['createElement']('br'));};},_0x160fb2['readAsDataURL'](_0x3be0e2);}};},_0x4642e6[_0x30fdcb(0xcc)](_0x91a444);}}function _0x3b3a(){const _0x9a8614=['mCtIU','154VjSMpP','classList','textDecoration','createElement','MnUre','#fff','150','enjrR','vqxgo','length','borderRadius','99YECXge','height','ztBmE','bannerPreviewContainer','image/','customHeight','width','pkyyV','margin','custom_banner_','color','href','28534209qsNWjd','border','FmgDp','651025WtpbDw','ZNnUe','zcTpb','toFixed','oMMBG','63508sVrbTb','marginTop','getElementById','size-info','backgroundColor','SgZgU','TueVW','value','dfQbA','split','result','prpcS','20px','readAsDataURL','WMhJp','pHkOv','QtrdY','FzBgP','5px','add','UaLRS','\x20KB\x20|\x20Compressed\x20Size:\x20','\x20|\x20','Download\x20Image\x20','onload','imageFormat','AyOaU','BDyPO','10px\x2020px','customWidth','TOknX','361070GpWnyg','5px\x200','Original\x20Size:\x20','2wDExoU','target','fYwve','download','div','300','\x20KB\x20|\x20Compressed\x20Width:\x20','innerHTML','1144265iYGzKH','YPwun','ZPUQl','sUUNC','style','dxcrN','drawImage','padding','30492wkFvbW','\x20|\x20Compressed\x20Height:\x20','1px\x20solid\x20#ccc','xqPMp','pfKKp','size','aqJDt','files','toDataURL','4197824AubUNQ','src','ydcmR','textContent','getContext','45RTpEbl','MzUaW','appendChild','PdvHP'];_0x3b3a=function(){return _0x9a8614;};return _0x3b3a();}function resetPreview(){const _0x3f01c0=_0x2739,_0x383730={};_0x383730[_0x3f01c0(0xcd)]='imageInput',_0x383730[_0x3f01c0(0xec)]=_0x3f01c0(0xdc),_0x383730[_0x3f01c0(0xf5)]=_0x3f01c0(0x10a);const _0x45f8c8=_0x383730,_0x16adfa=document[_0x3f01c0(0xc1)](_0x3f01c0(0x112)),_0x4d1a60=document[_0x3f01c0(0xc1)](_0x45f8c8[_0x3f01c0(0xcd)]),_0x21b1ff=document[_0x3f01c0(0xc1)](_0x45f8c8[_0x3f01c0(0xec)]),_0x56678a=document[_0x3f01c0(0xc1)](_0x3f01c0(0x114));_0x16adfa[_0x3f01c0(0xe8)]='',_0x4d1a60[_0x3f01c0(0xc6)]='',_0x21b1ff[_0x3f01c0(0xc6)]=_0x3f01c0(0xe6),_0x56678a[_0x3f01c0(0xc6)]=_0x45f8c8[_0x3f01c0(0xf5)];}



 // sentence

const _0x3a9258=_0x51f8;(function(_0x580292,_0x58f990){const _0x44152c=_0x51f8,_0x5044b6=_0x580292();while(!![]){try{const _0x1cf516=parseInt(_0x44152c(0x1b9))/0x1+-parseInt(_0x44152c(0x1ba))/0x2+parseInt(_0x44152c(0x1c1))/0x3+-parseInt(_0x44152c(0x1b5))/0x4*(parseInt(_0x44152c(0x1af))/0x5)+-parseInt(_0x44152c(0x1b0))/0x6+parseInt(_0x44152c(0x1bb))/0x7*(-parseInt(_0x44152c(0x1b6))/0x8)+-parseInt(_0x44152c(0x1ab))/0x9*(-parseInt(_0x44152c(0x1c0))/0xa);if(_0x1cf516===_0x58f990)break;else _0x5044b6['push'](_0x5044b6['shift']());}catch(_0xfa39a7){_0x5044b6['push'](_0x5044b6['shift']());}}}(_0x4030,0x80d11));const sentenceInput=document[_0x3a9258(0x1ac)]('sentenceInput'),readButton=document[_0x3a9258(0x1ac)](_0x3a9258(0x1bf)),stopButton=document[_0x3a9258(0x1ac)]('stopButton');function _0x4030(){const _0x2d4a4d=['24jhENnZ','2368kVqGwP','none','addEventListener','575718HjuDtU','1595914MPUiWC','1897SaxAeS','speak','block','cancel','readButton','20cmNtNO','2440281EMbHjd','8212419txmYfw','getElementById','speechSynthesis','display','817945lYsxVp','4960722DyGylU','Text-to-speech\x20is\x20not\x20supported\x20in\x20this\x20browser.\x20Please\x20try\x20a\x20different\x20browser.','value','click','style'];_0x4030=function(){return _0x2d4a4d;};return _0x4030();}let utterance=null;readButton[_0x3a9258(0x1b8)](_0x3a9258(0x1b3),()=>{const _0x5be538=_0x3a9258,_0x174707=sentenceInput[_0x5be538(0x1b2)];readSentence(_0x174707);}),stopButton['addEventListener'](_0x3a9258(0x1b3),()=>{stopReading();});function readSentence(_0x11b5bf){const _0x3770b0=_0x3a9258;_0x3770b0(0x1ad)in window?(utterance=new SpeechSynthesisUtterance(_0x11b5bf),utterance['onend']=()=>{const _0x52c95a=_0x3770b0;readButton['style'][_0x52c95a(0x1ae)]='block',stopButton[_0x52c95a(0x1b4)][_0x52c95a(0x1ae)]='none';},readButton[_0x3770b0(0x1b4)][_0x3770b0(0x1ae)]=_0x3770b0(0x1b7),stopButton['style'][_0x3770b0(0x1ae)]=_0x3770b0(0x1bd),speechSynthesis[_0x3770b0(0x1be)](),speechSynthesis[_0x3770b0(0x1bc)](utterance)):alert(_0x3770b0(0x1b1));}function _0x51f8(_0x219a44,_0x389dd8){const _0x4030d7=_0x4030();return _0x51f8=function(_0x51f88e,_0xbbe368){_0x51f88e=_0x51f88e-0x1ab;let _0x2c9d35=_0x4030d7[_0x51f88e];return _0x2c9d35;},_0x51f8(_0x219a44,_0x389dd8);}function stopReading(){const _0xabb967=_0x3a9258;_0xabb967(0x1ad)in window&&utterance&&(speechSynthesis[_0xabb967(0x1be)](),stopButton[_0xabb967(0x1b4)][_0xabb967(0x1ae)]=_0xabb967(0x1b7),readButton[_0xabb967(0x1b4)]['display']=_0xabb967(0x1bd));}





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


