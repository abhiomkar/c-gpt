const APIKeyTextInputEl = (<HTMLInputElement>document.getElementById('api-key-textinput'));

document.addEventListener('DOMContentLoaded', async () => {
  APIKeyTextInputEl.value = (await chrome.storage.sync.get(["APIKey"])).APIKey || '';
});

APIKeyTextInputEl.addEventListener('input', () => {
  chrome.storage.sync.set({ APIKey: APIKeyTextInputEl.value });
});