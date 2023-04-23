const API_ENDPOINT_URI = 'https://api.openai.com/v1/chat/completions';

async function request(data) {
  // Create the request headers
  const headers = new Headers();
  const {APIKey} = await chrome.storage.sync.get(["APIKey"]);

  headers.append('Authorization', `Bearer ${APIKey}`);
  headers.append('Content-Type', 'application/json');

  // Create the request options
  const options = {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  };

  // Send the request
  const response = await fetch(API_ENDPOINT_URI, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}, ${APIKey}`);
  }

  return response.json();
}

export async function sendChatRequest(message, {cacheKey}) {
  const data = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": message},
    ]
  };

  const result = await chrome.storage.session.get([cacheKey]);
  let messages = result[cacheKey];
  if (!messages) {
    const response = await request(data);
    messages = data.messages;
    const {role, content} = response.choices[0].message;
    messages.push({
      role,
      content,
    });
    await chrome.storage.session.set({ [cacheKey]: messages });
  }

  return messages.slice(2);
}