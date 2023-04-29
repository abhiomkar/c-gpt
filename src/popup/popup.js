import { sendChatRequest } from "./request";
import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export function ChatTextInput(props) {
  return (
    <div class="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)]">
      <textarea
        
        rows="1"
        placeholder="Ask a question."
        class="outline-none m-0 w-full resize-none border-0 bg-transparent p-0 pr-7 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2 md:pl-0">
        </textarea>
    </div>
  );
}

export function Popup(props) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('Summarising...');

  const readPageContent = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const {parsedTitle, parsedByline, parsedSiteName, parsedTextContent, parsedLang, tabHostname} = await chrome.tabs.sendMessage(tab.id, {});
    if (!parsedTextContent) {
      setStatus('Unable to parse the page content. Try on a different page.');
      return;
    }

    const prompt = `
    Summarize the following content in few words. Also summarise the following content in few bulletpoints, reply in ${parsedLang} language: \n

    title: ${parsedTitle} \n
    Author: ${parsedByline} \n
    Site name: ${parsedSiteName} \n
    Article: ${parsedTextContent}
    `;

    try {
      const response = await sendChatRequest(prompt, {cacheKey: tabHostname+tab.id});
      // const response = [{content: `Functions and procedures in Postgres are not zero-cost abstractions, they're deducted from your performance budget. When you spend memory and CPU to manage a call stack, less of it is available to actually run queries. In severe cases that can manifest in some surprising ways, like unexplained latency spikes and replication lag.` }];
      setMessages(response);
      setStatus('');
    } catch (e) {
      setStatus('Something went wrong. Try again.');
      throw e;
    }
  }

  useEffect(() => {
    readPageContent();
  }, []);

  return (
    <div class="px-4 py-2 dark:bg-gray-800 h-full">
      <Messages messages={messages} />
      <Status status={status} />
      <ChatTextInput value={''} />
    </div>
  );
}

export function Messages({messages}) {
  return (
    <div class="text-gray-700 dark:text-gray-200 pb-4 text-sm">
      {messages.map((message) => (
        <div class="whitespace-pre-wrap">{message.content}</div>
      ))}
    </div>
  );
}

export function Status({status}) {
  if (!status) return;

  return (
    <div class="text-gray-700 dark:text-gray-200 pb-4">{status}</div>
  );
}

render(<Popup />, document.getElementById("popup"));
