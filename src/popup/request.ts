const API_ENDPOINT_URI = 'https://api.openai.com/v1/chat/completions';

async function request(body: string) {
  // Create the request headers
  const headers = new Headers();
  const {APIKey} = await chrome.storage.sync.get(["APIKey"]);
  if (!APIKey) {
    chrome.runtime.openOptionsPage();
  }

  headers.append('Authorization', `Bearer ${APIKey}`);
  headers.append('Content-Type', 'application/json');

  // Create the request options
  const options = {
    method: 'POST',
    headers,
    body: body,
  };

  // Send the request
  const response = await fetch(API_ENDPOINT_URI, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}, ${APIKey}`);
  }

  return response.json();
}

export interface MessageContent {
  role: string;
  content: string;
}

export async function sendChatRequest(messages: Array<MessageContent>): Promise<MessageContent> {
  const data = {
    "model": "gpt-3.5-turbo",
    "messages": messages,
  };

  const response = await request(JSON.stringify(data));
  // Sample response
  // {
  //   'id': 'chatcmpl-6p9XYPYSTTRi0xEviKjjilqrWU2Ve',
  //   'object': 'chat.completion',
  //   'created': 1677649420,
  //   'model': 'gpt-3.5-turbo',
  //   'usage': {'prompt_tokens': 56, 'completion_tokens': 31, 'total_tokens': 87},
  //   'choices': [
  //     {
  //      'message': {
  //        'role': 'assistant',
  //        'content': 'The 2020 World Series was played in Arlington, Texas at the Globe Life Field, which was the new home stadium for the Texas Rangers.'},
  //      'finish_reason': 'stop',
  //      'index': 0
  //     }
  //    ]
  //  }
  const {role, content} = response.choices[0].message;
  return {role, content};
}