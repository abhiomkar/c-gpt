import { sendChatRequest } from "./request";

const reponseEl = document.querySelector('.response');
const summariseButton = document.querySelector('.summarise-button');

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

document.addEventListener('DOMContentLoaded', async () => {
  const tab = await getCurrentTab();
  const {parsedTitle, parsedByline, parsedSiteName, parsedTextContent, tabHostname} = await chrome.tabs.sendMessage(tab.id, {});
  if (!parsedTextContent) {
    reponseEl.innerText = 'Unable to parse the page content. Try on a different page.';
    return;
  }

  reponseEl.innerText = 'Summarising...';
  const prompt = 'Summarise the following content in few bulletpoints:';
  const fullPrompt = `${prompt}\n\n title: ${parsedTitle}\n Author: ${parsedByline}\n Site name: ${parsedSiteName}\n\n Article: ${parsedTextContent}`;
  try {
    const messages = await sendChatRequest(fullPrompt, {cacheKey: tabHostname+tab.id});
    reponseEl.innerText = messages.map((message) => {
      return `\n${message.role}: ${message.content}\n`;
    });
  } catch (e) {
    reponseEl.innerText = 'Something went wrong. Try again.';
    throw e;
  }
});

