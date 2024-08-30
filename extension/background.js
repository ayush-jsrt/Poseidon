chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'elementSelected') {
        chrome.storage.local.set({ selectedElementHtml: request.elementHtml });
    }
});

// Listener for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedElement') {
        chrome.storage.local.get('selectedElementHtml', (data) => {
            sendResponse({ elementHtml: data.selectedElementHtml });
        });

        return true;
    }
});