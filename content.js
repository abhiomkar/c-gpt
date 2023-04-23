chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    const {textContent, title, byline, siteName, lang} = new window.__cgpt_Readability(document.cloneNode(true)).parse();

    const response = {
      tabUrl: document.URL,
      tabTitle: document.title,
      parsedTextContent: textContent,
      parsedTitle: title,
      parsedByline: byline,
      parsedSiteName: siteName,
      parsedLang: lang,
    };

    sendResponse(response);
  }
);