import { sendChatRequest } from "./request";
import { h, render, FunctionComponent } from 'preact';
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';

const ChatTextInput: FunctionComponent<{onChatInput: Function}> = ({ onChatInput }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)!;
  const baselineScrollHeight = useRef<number>(0);

  useLayoutEffect(() => {
    if (!textareaRef.current) return;

    baselineScrollHeight.current = textareaRef.current.scrollHeight;
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;

    if (!event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      submitForm(event.target.form!);
      autoResize(event);
      return;
    }
  }

  const autoResize = (event: KeyboardEvent | InputEvent) => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;

    // auto resize textarea
    event.target.style.height = 'auto';
    event.target.style.height = event.target.scrollHeight + 'px';
  };

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    if (!event.target) return;

    submitForm(event.target.form!)
  }

  const submitForm = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    onChatInput(formData.get('chatInput') || '');
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      class="text-sm flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900 dark:text-white dark:bg-gray-700 rounded-md">
      <textarea
        autofocus
        onKeyDown={handleKeyDown}
        onInput={autoResize}
        rows={1}
        name="chatInput"
        placeholder="Ask a question."
        ref={textareaRef}
        class="max-h-[200] outline-none m-0 w-full resize-none border-0 bg-transparent p-0 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2 md:pl-0">
      </textarea>
      <button type="submit" aria-label="Ask a question." class="absolute right-2 inset-y-0 text-gray-600 dark:text-gray-200"><SendIcon height={24} width={24} /></button>
    </form>
  );
}

const SendIcon: FunctionComponent<{ height: number, width: number }> = ({ height, width }) => {
  return (
    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" height={height} viewBox="0 96 960 960" width={width}>
      <path d="M120 896V256l760 320-760 320Zm60-93 544-227-544-230v168l242 62-242 60v167Zm0 0V346v457Z" />
    </svg>
  );
}

async function getCacheKeyForCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = (tab.pendingUrl || tab.url || '').split('#')[0];
  return `c-${tab.id}-${tabUrl}`;
}

function Popup() {
  return (
    <Chat />
  );
}

interface MessageContent {
  role: string;
  content: string;
}

function Chat() {
  const [messages, setMessages] = useState<Array<MessageContent>>([]);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [initialRender, setInitialRender] = useState(true);
  const scrollableChatRef = useRef<HTMLInputElement>(null);

  const readPageContentFromTabId = async (tabId: number) => {
    return chrome.tabs.sendMessage(tabId, {});
  };

  const constructInitialPromptFromPageContent = ({ parsedTitle, parsedByline, parsedSiteName, parsedTextContent, parsedLang }: { parsedTitle: string, parsedByline: string, parsedSiteName: string, parsedTextContent: string, parsedLang: string }) => {
    return `
    Summarize the following content in few words. Also summarise the following content in few bulletpoints, reply in ${parsedLang} language. Respond in markdown format: \n

    title: ${parsedTitle} \n
    Author: ${parsedByline} \n
    Site name: ${parsedSiteName} \n
    Article: ${parsedTextContent}
    `;
  };

  useEffect(() => {
    (async () => {
      if (initialRender) {
        setInitialRender(false);

        const cacheKey = await getCacheKeyForCurrentTab();
        const cachedMessages = (await chrome.storage.session.get(cacheKey))[cacheKey];
      
        if (cachedMessages) {
          setMessages(cachedMessages);
          return;
        }
      }

      let messagesData = [...messages];
      let promptData = prompt;

      // Avoid reading the page content on every prompt change.
      if (messagesData.filter((message) => message.role === 'user').length === 0) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id === undefined) throw new Error('Tab id is not a number.');
        const pageContent = await readPageContentFromTabId(tab.id);

        if (!pageContent.parsedTextContent) {
          setStatus('Unable to parse the page content. Try on a different page.');
          return;
        }

        promptData = constructInitialPromptFromPageContent(pageContent);
        messagesData = [{
          "role": "system",
          "content": "You are a helpful assistant.",
        }];
        setStatus('Summarising...');
      } else {
        setStatus('Thinking...');
      }

      messagesData = [...messagesData, { "role": "user", "content": promptData }];
      setMessages(messagesData);

      try {
        const response = await sendChatRequest(messagesData);
        //  Example response: {content: 'foo bar content', role: 'assistant'};
        setMessages([...messagesData, response]);
        setStatus('');
      } catch (e) {
        setStatus('Something went wrong. Try again. ' + e.toString());
        throw e;
      }
    })();
  }, [prompt]);

  useEffect(() => {
    (async () => {
      const cacheKey = await getCacheKeyForCurrentTab();
      chrome.storage.session.set({ [cacheKey]: messages });

      if (!(scrollableChatRef.current instanceof HTMLElement)) {
        throw new Error('scrollableChatRef is not an instance of HTMLElement.');
      }
      scrollableChatRef.current.scrollTop = scrollableChatRef.current.scrollHeight;
    })();
  }, [messages]);

  return (
    <div class="relative dark:bg-gray-800 h-full">
      <div class="absolute overflow-y-auto h-[396] px-4 py-2" ref={scrollableChatRef}>
        <Messages messages={messages} />
      </div>
      <div class="absolute inset-x-2 bottom-2">
        <Status status={status} />
        <ChatTextInput onChatInput={(input: string) => setPrompt(input)} />
      </div>
    </div>
  );
}

const Messages: FunctionComponent<{ messages: Array<MessageContent> }> = ({ messages }) => {
  return (
    <div class="grid grid-cols-1 gap-2 text-gray-700 dark:text-gray-200 pb-4 text-sm">
      {messages.slice(2).map((message) => (
        <div class="whitespace-pre-wrap "><strong>{message.role}:</strong> {message.content}</div>
      ))}
    </div>
  );
}

const Status: FunctionComponent<{ status: string }> = ({ status }) => {
  return (
    <div class="text-gray-700 dark:text-gray-200 px-1 py-2 font-medium text-sm">{status}</div>
  );
}

const popupEl = document.getElementById('popup');
if (popupEl) {
  render(<Popup />, popupEl);  
} else {
  throw new Error('popup element not found');
}