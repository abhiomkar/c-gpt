import { sendChatRequest } from "./request";
import { h, render, FunctionComponent, ComponentChildren, ComponentType } from 'preact';
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';
import { SendIcon, AssistantIcon, UserIcon, TypingAnimation } from '../icons/icons';

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
      <button type="submit" aria-label="Ask a question." class="absolute right-2 inset-y-0 text-gray-600 dark:text-gray-200"><SendIcon /></button>
    </form>
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
  const [isAwaitingNetworkRequest, setIsAwaitingNetworkRequest] = useState(false);
  const scrollableChatRef = useRef<HTMLInputElement>(null);

  const readPageContentFromTabId = async (tabId: number) => {
    return chrome.tabs.sendMessage(tabId, {});
  };

  const promptDelimitor = `CGPT_${Math.floor(Math.random() * 100000)}`;
  const constructInitialPromptFromPageContent = ({ parsedTitle, parsedByline, parsedSiteName, parsedTextContent, parsedLang }: { parsedTitle: string, parsedByline: string, parsedSiteName: string, parsedTextContent: string, parsedLang: string }) => {
    return `
    Summarize the text delimited by word ${promptDelimitor} in 20 words.
    The summary should be in ${parsedLang} language.
    \n
    ${promptDelimitor}
    title: ${parsedTitle} \n
    Author: ${parsedByline} \n
    Site name: ${parsedSiteName} \n
    Article: ${parsedTextContent}
    ${promptDelimitor}
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
      } 

      messagesData = [...messagesData, { "role": "user", "content": promptData }];
      setMessages(messagesData);

      try {
        setIsAwaitingNetworkRequest(true);
        const response = await sendChatRequest(messagesData);
        //  Example response: {content: 'foo bar content', role: 'assistant'};
        setMessages([...messagesData, response]);
        setStatus('');
      } catch (e: any) {
        setStatus('Something went wrong. Try again. ' + e.toString());
        throw e;
      } finally {
        setIsAwaitingNetworkRequest(false);
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
      <div class="absolute overflow-y-auto h-[396] w-full" ref={scrollableChatRef}>
        <Messages messages={messages} />
        {isAwaitingNetworkRequest ? (<Message role='assistant'><TypingAnimation /></Message>) : null}
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
    <div class="grid grid-cols-1">
      {messages.slice(2).map((message) => (
        <Message role={message.role}>{message.content}</Message>
      ))}
    </div>
  );
};

const Message: FunctionComponent<{ role: string, children: ComponentChildren}> = ({ role, children }) => {
  return (
    <div class={role === 'user' ? 'bg-gray-100 dark:bg-gray-700' : ''}>
      <div class="flex gap-4 px-4 py-4 text-gray-700 dark:text-gray-200 pb-4 text-sm">
        <div class="flex-none">
          {role === 'user' ? (<UserIcon />) : (<AssistantIcon />)}
        </div>
        <div class="whitespace-pre-wrap flex-auto flex items-center">
          {children}
        </div>
      </div>
    </div>
  );
};

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