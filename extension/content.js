let isSelectionMode = false;
let previousElement = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startSelectionMode') {
        startSelectionMode();
        sendResponse({ status: 'selection mode started' });
    }
});

function startSelectionMode() {
    isSelectionMode = true;
    document.addEventListener('mousemove', highlightElement);
    document.addEventListener('click', selectElement);
}

function highlightElement(event) {
    if (!isSelectionMode) return;

    const element = document.elementFromPoint(event.clientX, event.clientY);

    if (element !== previousElement) {
        if (previousElement) {
            removeHighlight(previousElement);
        }

        // Apply the blue border and blur effect to the current element
        applyHighlight(element);
        previousElement = element;
    }
}

function applyHighlight(element) {
    // Apply the blue border and blur effect
    element.style.outline = '5px solid rgba(0, 0, 255, 0.1)';
    element.style.filter = 'blur(1px)';
    element.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';

    element.style.position = 'relative';
}


function removeHighlight(element) {
    element.style.outline = '';
    element.style.filter = '';
    element.style.backgroundColor = '';

    element.style.position = '';
}


function selectElement(event) {
    if (!isSelectionMode) return;
    event.preventDefault();

    const scrollPosition = { top: window.scrollY, left: window.scrollX };
    const element = document.elementFromPoint(event.clientX, event.clientY);

    removeHighlight(element);
    const selectedElementHtml = element.outerHTML;
    chrome.runtime.sendMessage({ action: 'elementSelected', elementHtml: selectedElementHtml });

    endSelectionMode();

    setTimeout(() => {
        window.scrollTo(scrollPosition.left, scrollPosition.top);
    }, 10);
}

function endSelectionMode() {
    isSelectionMode = false;
    if (previousElement) {
        // Remove styles from the last highlighted element
        removeHighlight(previousElement);
    }
    document.removeEventListener('mousemove', highlightElement);
    document.removeEventListener('click', selectElement);
}
