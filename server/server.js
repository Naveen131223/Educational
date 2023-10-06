const express = require('express');
const { ChatCompletion } = require('g4f');
const { request, Response, stream_with_context } = require('flask');
const { get } = require('requests');
const { special_instructions } = require('./config');
 
class BackendApi {
  constructor(bp, config) {
    this.bp = bp;
    this.routes = {
      '/backend-api/v2/conversation': {
        function: this._conversation,
        methods: ['POST'],
      },
    };
  }

  _conversation(req, res) {
    const conversationId = req.body.conversation_id;

    try {
      const jailbreak = req.body.jailbreak;
      const model = req.body.model;
      const messages = this.buildMessages(jailbreak, req);

      // Generate response
      const response = ChatCompletion.create({
        model: model,
        chatId: conversationId,
        messages: messages,
      });

      res
        .status(200)
        .send({
          bot: response, // Modify this with your actual response
        });
    } catch (error) {
      console.error(error);
      res.status(400).send({
        _action: '_ask',
        success: false,
        error: `An error occurred ${error.toString()}`,
      });
    }
  }

  buildMessages(jailbreak, req) {
    const conversation = req.body.meta.content.conversation;
    const internetAccess = req.body.meta.content.internet_access;
    const prompt = req.body.meta.content.parts[0];
    const conversationId = req.body.conversation_id;

    // Add the existing conversation
    const messages = conversation;

    // Add web results if enabled
    if (internetAccess) {
      const current_date = new Date().toISOString().split('T')[0];
      const query = `Current date: ${current_date}. ${prompt.content}`;
      const searchResults = this.fetchSearchResults(query);

      messages.push(...searchResults);
    }

    // Add jailbreak instructions if enabled
    const jailbreakInstructions = this.getJailbreak(jailbreak);
    if (jailbreakInstructions) {
      messages.push(...jailbreakInstructions);
    }

    // Add the prompt
    messages.push(prompt);

    // Reduce conversation size to avoid API Token quantity error
    if (messages.length > 3) {
      messages = messages.slice(-4);
    }

    return messages;
  }

  fetchSearchResults(query) {
    const search = get('https://ddg-api.herokuapp.com/search', {
      params: {
        query: query,
        limit: 3,
      },
    });

    let snippets = '';
    for (let index = 0; index < search.json().length; index++) {
      const result = search.json()[index];
      const snippet = `[${index + 1}] "${result.snippet}" URL:${result.link}.`;
      snippets += snippet;
    }

    const response = `Here are some updated web searches. Use this to improve user response:${snippets}`;

    return [{ role: 'system', content: response }];
  }

  *generateStream(response, jailbreak) {
    if (this.getJailbreak(jailbreak)) {
      let responseJailbreak = '';
      let jailbrokenChecked = false;

      for (const message of response) {
        responseJailbreak += message;

        if (jailbrokenChecked) {
          yield message;
        } else {
          if (this.responseJailbrokenSuccess(responseJailbreak)) {
            jailbrokenChecked = true;
          }

          if (this.responseJailbrokenFailed(responseJailbreak)) {
            yield responseJailbreak;
            jailbrokenChecked = true;
          }
        }
      }
    } else {
      yield* response;
    }
  }

  responseJailbrokenSuccess(response) {
    const actMatch = response.match(/ACT:/s);
    return Boolean(actMatch);
  }

  responseJailbrokenFailed(response) {
    return response.length < 4 || !(response.startsWith('GPT:') || response.startsWith('ACT:'));
  }

  getJailbreak(jailbreak) {
    if (jailbreak !== 'default') {
      special_instructions[jailbreak][0]['content'] += special_instructions['two_responses_instruction'];
      if (special_instructions[jailbreak]) {
        return special_instructions[jailbreak];
      }
    }
    return null;
  }
}

const app = express();
const backendApi = new BackendApi(app, {});

app.listen(5000, () => console.log('AI server started on http://localhost:5000'));
