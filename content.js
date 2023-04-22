chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    const parsedTextContent = new window.__cgpt_Readability(document.cloneNode(true)).parse().textContent;

    const response = {
      tabUrl: document.URL,
      tabTitle: document.title,
      parsedTextContent: parsedTextContent,
    };

    sendResponse(response);
  }
);