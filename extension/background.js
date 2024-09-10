chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'elementSelected') {
        chrome.storage.local.get('selectedElementHtml', (result) => {
            let htmlArray = result.selectedElementHtml || [];
            htmlArray.unshift(request.elementHtml);
            chrome.storage.local.set({ selectedElementHtml: htmlArray });
        });
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