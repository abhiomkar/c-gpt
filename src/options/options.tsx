import { h, render, FunctionComponent } from 'preact';

const Options: FunctionComponent<{apiKey: string}> = ({apiKey}) => {
  return (
    <div class="px-4 h-full bg-gray-50 dark:bg-stone-800">
      <div class="max-w-xl mx-auto border-x dark:border-x-transparent px-16 py-8 h-full bg-white dark:bg-stone-900">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-50">C-GPT Options</h1>
        </div>
        <div class="pt-8">
          <label for="api-key-textinput" class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50">OpenAI API Key</label>
          <div class="mt-2">
            <input type="text"
              value={apiKey}
              onInput={(e) => chrome.storage.sync.set({ APIKey: (e.target as HTMLInputElement).value })}
              name="api-key-textinput"
              id="api-key-textinput"
              autocomplete="off"
              autofocus
              class="block w-full outline-none rounded-md border-0 p-1.5 text-gray-900 dark:bg-stone-950 dark:text-gray-50 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-300 sm:text-sm sm:leading-6"
              />
          </div>
        </div>
        <div class="pt-4">
          <div class="text-sm dark:text-gray-50">Get an OpenAI <a href="https://platform.openai.com/account/api-keys" target="_blank" class="hover:underline text-sm font-medium leading-6 text-blue-600 dark:text-blue-300">API key</a> and paste it above.</div>
        </div>
      </div>
    </div>
  );
};

(async () => {
  const optionsEl = document.getElementById('options');
  if (!optionsEl) {
    throw new Error('options element not found');
  }

  const apiKey = (await chrome.storage.sync.get(["APIKey"])).APIKey || ''
  render(<Options apiKey={apiKey} />, optionsEl);  
})();