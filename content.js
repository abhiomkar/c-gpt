chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    sendResponse({tabTitle: document.title, tabUrl: document.URL});
  }
);