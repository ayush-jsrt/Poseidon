document.getElementById('picker').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelectionMode' }, (response) => {
            if (response && response.status === 'selection mode started') {
                document.getElementById('results').textContent = 'Selection mode activated. Click on an element to select it.';

                window.close();
            }
        });
    });
});

chrome.storage.local.get('selectedElementHtml', (data) => {
    if (data.selectedElementHtml) {
        document.getElementById('results').innerHTML = `Selected element: <br>${data.selectedElementHtml}`;
    }
});


