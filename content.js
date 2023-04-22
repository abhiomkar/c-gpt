chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    const response = {};
    
    if (request.tabUrl !== undefined) {
      response.tabUrl = document.URL;
    }

    if (request.tabTitle !== undefined) {
      response.tabTitle = document.title;
    }

    sendResponse(response);
  }
);