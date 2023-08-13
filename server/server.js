const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { ChatCompletion } = require('g4f');
const { Translator } = require('googletrans');

const app = express();
const port = 3000; // Change this to your desired port

app.use(bodyParser.json());

const specialInstructions = require('./server/config').special_instructions;

class BackendApi {
  constructor(config) {
    this.useAutoProxy = config.use_auto_proxy;
    this.routes = {
      '/backend-api/v2/conversation': {
        function: this.conversation,
        methods: ['POST']
      }
    };
  }

  conversation(req, res) {
    const maxRetries = 3;
    let retries = 0;
    const conversationId = req.body.conversation_id;

    const buildMessages = jailbreak => {
      const conversation = req.body.meta.content.conversation;
      const internetAccess = req.body.meta.content.internet_access;
      const prompt = req.body.meta.content.parts[0];

      const current_date = new Date().toISOString().split('T')[0];
      const systemMessage = `You are ChatGPT also known as ChatGPT, a large language model trained by OpenAI. Strictly follow the users instructions. Knowledge cutoff: 2021-09-01 Current date: ${current_date}. ${setResponseLanguage(
        prompt
      )}`;

      const messages = [
        { role: 'system', content: systemMessage },
        ...conversation,
        ...(internetAccess ? fetchSearchResults(prompt.content) : []),
        ...getJailbreak(jailbreak),
        prompt
      ];

      if (messages.length > 3) {
        return messages.slice(-4);
      }
      return messages;
    };

    const fetchSearchResults = async query => {
      try {
        const response = await axios.get('https://ddg-api.herokuapp.com/search', {
          params: {
            query: query,
            limit: 3
          }
        });

        return response.data.map((result, index) => ({
          role: 'system',
          content: `[${index + 1}] "${result.snippet}" URL:${result.link}.`
        }));
      } catch (error) {
        console.error(error);
        return [];
      }
    };

    const setResponseLanguage = async prompt => {
      const translator = new Translator();
      const detectedLanguage = await translator.detectLanguage(prompt.content);
      return `You will respond in the language: ${detectedLanguage}. `;
    };

    const getJailbreak = jailbreak => {
      if (jailbreak !== 'default') {
        specialInstructions[jailbreak][0].content += specialInstructions.two_responses_instruction;
        if (specialInstructions[jailbreak]) {
          return specialInstructions[jailbreak];
        } else {
          return null;
        }
      } else {
        return null;
      }
    };

    const generateStream = (response, jailbreak) => {
      if (getJailbreak(jailbreak)) {
        let responseJailbreak = '';
        let jailbrokenChecked = false;

        for (const message of response) {
          responseJailbreak += message.content;

          if (jailbrokenChecked) {
            yield message;
          } else {
            if (responseJailbrokenSuccess(responseJailbreak)) {
              jailbrokenChecked = true;
            }
            if (responseJailbrokenFailed(responseJailbreak)) {
              yield responseJailbreak;
              jailbrokenChecked = true;
            }
          }
        }
      } else {
        yield* response;
      }
    };

    const responseJailbrokenSuccess = response => {
      const actMatch = /ACT:/s.exec(response);
      return Boolean(actMatch);
    };

    const responseJailbrokenFailed = response => {
      return response.length < 4 || !(response.startsWith('GPT:') || response.startsWith('ACT:'));
    };

    const jailbreak = req.body.jailbreak;
    const model = req.body.model;
    const messages = buildMessages(jailbreak);

    try {
      ChatCompletion.create({
        model,
        stream: true,
        chatId: conversationId,
        messages
      }).then(response => {
        res.set('Content-Type', 'text/event-stream');
        generateStream(response, jailbreak).forEach(message => res.write(`data: ${message}\n\n`));
      });
    } catch (error) {
      console.error(error);
      retries++;

      if (retries >= maxRetries) {
        res.status(400).json({
          _action: '_ask',
          success: false,
          error: `an error occurred ${error}`
        });
      } else {
        setTimeout(() => conversation(), 3000); // Wait 3 seconds before trying again
      }
    }
  }
}

const config = {
  use_auto_proxy: false // Set this to true if needed
};

const backendApi = new BackendApi(config);

app.post('/backend-api/v2/conversation', (req, res) => backendApi.conversation(req, res));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
