import { sendChatRequest } from "./request";
import { h, render } from 'preact';
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';

export function ChatTextInput({ onChatInput }) {
  const textareaRef = useRef(null);
  const baselineScrollHeight = useRef(0);

  useLayoutEffect(() => {
    baselineScrollHeight.current = textareaRef.current.scrollHeight;
  }, []);

  const handleKeyDown = (event) => {
    if (!event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      submitForm(event.target.form);
      autoResize(event);
      return;
    }
  }

  const autoResize = (event) => {
    // auto resize textarea
    event.target.style.height = 'auto';
    event.target.style.height = event.target.scrollHeight + 'px';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitForm(event.target.form)
  }

  const submitForm = (form) => {
    const formData = new FormData(form);
    const { chatInput } = Object.fromEntries(formData.entries());
    onChatInput(chatInput);
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      class="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)]">
      <textarea
        onKeyDown={handleKeyDown}
        onInput={autoResize}
        rows="1"
        name="chatInput"
        placeholder="Ask a question."
        ref={textareaRef}
        class="max-h-[200] outline-none m-0 w-full resize-none border-0 bg-transparent p-0 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2 md:pl-0">
      </textarea>
      <button type="submit" aria-label="Ask a question." class="absolute right-2 bottom-2 text-gray-600 dark:text-gray-200"><SendIcon height={24} width={24} /></button>
    </form>
  );
}

function SendIcon({ height, width }) {
  return (
    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 96 960 960" width={width}>
      <path d="M120 896V256l760 320-760 320Zm60-93 544-227-544-230v168l242 62-242 60v167Zm0 0V346v457Z" />
    </svg>
  );
}

async function getCacheKeyForCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = (tab.pendingUrl || tab.url).split('#')[0];
  return `c-${tab.id}-${tabUrl}`;
}

function Popup() {
  return (
    <Chat />
  );
}

function Chat() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [initialRender, setInitialRender] = useState(true);

  const readPageContentFromTab = async (tab) => {
    return chrome.tabs.sendMessage(tab.id, {});
  };

  const constructInitialPromptFromPageContent = (pageContent) => {
    const { parsedTitle, parsedByline, parsedSiteName, parsedTextContent, parsedLang } = pageContent;

    return `
    Summarize the following content in few words. Also summarise the following content in few bulletpoints, reply in ${parsedLang} language. Respond in markdown format: \n

    title: ${parsedTitle} \n
    Author: ${parsedByline} \n
    Site name: ${parsedSiteName} \n
    Article: ${parsedTextContent}
    `;
  };

  useEffect(async () => {
    if (initialRender) {
      const cacheKey = await getCacheKeyForCurrentTab();
      const cachedMessages = (await chrome.storage.session.get(cacheKey))[cacheKey];
    
      if (cachedMessages) {
        setMessages(cachedMessages);
        setInitialRender(false);
        return;
      }
    }

    let messagesData = [...messages];
    let promptData = prompt;
      
    // Read the page content only on first render.
    // This is to avoid reading the page content on every prompt change or when the chat is restored from cache.
    if (messagesData.filter((message) => message.role === 'user').length === 0) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageContent = await readPageContentFromTab(tab);

      if (!pageContent.parsedTextContent) {
        setStatus('Unable to parse the page content. Try on a different page.');
        return;
      }

      promptData = constructInitialPromptFromPageContent(pageContent);
      messagesData = [{
        "role": "system",
        "content": "You are a helpful assistant.",
      }];
    }

    messagesData = [...messagesData, { "role": "user", "content": promptData }];
    setMessages(messagesData);

    try {
      setStatus('Summarising...');
      const response = await sendChatRequest(messagesData);
      //  Example response: {content: 'foo bar content', role: 'assistant'};
      setMessages([...messagesData, response]);
      setStatus('');
    } catch (e) {
      setStatus('Something went wrong. Try again. ' + e.toString());
      throw e;
    }
  }, [prompt]);

  useEffect(async () => {
    const cacheKey = await getCacheKeyForCurrentTab();
    chrome.storage.session.set({ [cacheKey]: messages });
  }, [messages]);

  return (
    <div class="px-4 py-2 dark:bg-gray-800 h-full overflow-y-auto">
      <Messages messages={messages} />
      <Status status={status} />
      <ChatTextInput onChatInput={(input) => setPrompt(input)} />
    </div>
  );
}

export function Messages({ messages }) {
  return (
    <div class="grid grid-cols-1 divide-y text-gray-700 dark:text-gray-200 pb-4 text-sm">
      {messages.slice(2).map((message) => (
        <div class="whitespace-pre-wrap "><strong>{message.role}:</strong> {message.content}</div>
      ))}
    </div>
  );
}

export function Status({ status }) {
  if (!status) return;

  return (
    <div class="text-gray-700 dark:text-gray-200 pb-4">{status}</div>
  );
}

render(<Popup />, document.getElementById("popup"));
