import { sendChatRequest } from "./request";

const reponseEl = document.querySelector('.chat-messages');
const summariseButton = document.querySelector('.summarise-button');

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

document.addEventListener('DOMContentLoaded', async () => {
  const tab = await getCurrentTab();
  const {parsedTitle, parsedByline, parsedSiteName, parsedTextContent, parsedLang, tabHostname} = await chrome.tabs.sendMessage(tab.id, {});
  if (!parsedTextContent) {
    reponseEl.innerText = 'Unable to parse the page content. Try on a different page.';
    return;
  }

  reponseEl.innerText = 'Summarising...';
  const pageContent = `\n title: ${parsedTitle}\n Author: ${parsedByline}\n Site name: ${parsedSiteName}\n\n Article: ${parsedTextContent}`;
  const prompt = `
    Summarize the following content in few words. Also summarise the following content in few bulletpoints, reply in ${parsedLang} language:

    ${pageContent}
    `;

  try {
    const messages = await sendChatRequest(prompt, {cacheKey: tabHostname+tab.id});
    reponseEl.innerText = messages.map((message) => {
      return message.content;
    });
  } catch (e) {
    reponseEl.innerText = 'Something went wrong. Try again.';
    throw e;
  }
});

