function render() {
  chrome.storage.sync.get({ APIKey: ''},
    (items) => {
      console.log(items.APIKey);
    });
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('chrome://')) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: render
  });
});