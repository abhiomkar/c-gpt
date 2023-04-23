const APIKeyTextInputEl = document.getElementById('api-key-textinput')

document.addEventListener('DOMContentLoaded', async () => {
  APIKeyTextInputEl.value = (await chrome.storage.sync.get(["APIKey"])).APIKey || '';
});

APIKeyTextInputEl.addEventListener('input', (event) => {
  chrome.storage.sync.set({ APIKey: event.target.value });
});