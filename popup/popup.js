const reponseEl = document.querySelector('.response');

document.querySelector('button').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['popup/external/@mozilla/readability/Readability.js'],
  });

  const {parsedTextContent} = await chrome.tabs.sendMessage(tab.id, {});
  if (!parsedTextContent) {
    reponseEl.innerText = 'Unable to parse the page content. Try on a different page.';
    return;
  }

  reponseEl.innerText = 'Summarising...';
  const chatResponse = await sendChatMessage('Summarise the following content in few bulletpoints:\n\n ' + parsedTextContent);
  reponseEl.innerText = chatResponse.choices[0].message.content;
});

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

async function sendChatMessage(message) {
  const data = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": message},
    ]
  };

  return request(data);
}
