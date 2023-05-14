import {Readability} from '@mozilla/readability';

chrome.runtime.onMessage.addListener(
  async (request, sender, sendResponse) => {
    const {textContent, title, byline, siteName, lang} = new Readability(document.cloneNode(true) as Document).parse() || {};

    const response = {
      tabUrl: document.URL,
      tabTitle: document.title,
      tabHostname: document.location.hostname,
      parsedTextContent: textContent,
      parsedTitle: title,
      parsedByline: byline,
      parsedSiteName: siteName,
      parsedLang: lang,
    };

    sendResponse(response);
  }
);