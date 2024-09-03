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
        // Convert stored HTML string back into a DOM element
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.selectedElementHtml, 'text/html');
        const selectedElement = doc.body.firstChild;

        // Pass the DOM element to the htmlToMarkdown function
        document.getElementById('results').innerHTML = `<pre>${htmlToMarkdown(selectedElement)}</pre>`;
    }
});

function htmlToMarkdown(element) {
    let markdown = '';

    function processNode(node, depth = 0) {
        const indent = ' '.repeat(depth * 2);
        
        if (node.nodeType === Node.ELEMENT_NODE && (node.classList.contains('icon-md') || node.classList.contains('text-token-text-quaternary') || node.classList.contains('mt-1'))) {
            console.log('Skipping element:', node); 
            // Skip further processing for this element
            return;
        }

        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                switch (node.tagName.toLowerCase()) {
                    case 'h1':
                        markdown += `# ${node.textContent.trim()}\n\n`;
                        break;
                    case 'h2':
                        markdown += `## ${node.textContent.trim()}\n\n`;
                        break;
                    case 'h3':
                        markdown += `### ${node.textContent.trim()}\n\n`;
                        break;
                    case 'h4':
                        markdown += `#### ${node.textContent.trim()}\n\n`;
                        break;
                    case 'h5':
                        markdown += `##### ${node.textContent.trim()}\n\n`;
                        break;
                    case 'h6':
                        markdown += `###### ${node.textContent.trim()}\n\n`;
                        break;
                    case 'p':
                        markdown += `${processTextWithLineBreaks(node)}\n\n`;
                        break;
                    case 'strong':
                    case 'b':
                        markdown += `**${processTextWithLineBreaks(node)}**`;
                        break;
                    case 'em':
                    case 'i':
                        markdown += `*${processTextWithLineBreaks(node)}*`;
                        break;
                    case 'u':
                        markdown += `__${processTextWithLineBreaks(node)}__`;
                        break;
                    case 'a':
                        markdown += `[${node.textContent.trim()}](${node.getAttribute('href')})`;
                        break;
                    case 'img':
                        markdown += `![${node.getAttribute('alt') || ''}](${node.getAttribute('src')})`;
                        break;
                    case 'ul':
                    case 'ol':
                        markdown += '\n';
                        node.childNodes.forEach(child => processNode(child, depth + 1));
                        markdown += '\n';
                        break;
                    case 'li':
                        markdown += `${indent}- `;
                        node.childNodes.forEach(child => processNode(child, depth));
                        markdown += '\n';
                        break;
                    case 'blockquote':
                        markdown += `> ${processTextWithLineBreaks(node)}\n\n`;
                        break;
                    case 'pre':
                        markdown += `\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
                        break;
                    case 'code':
                        if (node.parentNode.tagName.toLowerCase() === 'pre') {
                            markdown += `\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
                        } else {
                            markdown += `\`${node.textContent.trim()}\``;
                        }
                        break;
                    default:
                        node.childNodes.forEach(child => processNode(child, depth));
                        break;
                }
                break;
            case Node.TEXT_NODE:
                markdown += node.textContent.trim();
                break;
        }
    }

    function processTextWithLineBreaks(node) {
        return Array.from(node.childNodes)
            .map(child => (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'code')
                ? `\`${child.textContent.trim()}\``
                : child.textContent.trim())
            .join('');
    }

    processNode(element);
    console.log(markdown);
    return markdown.trim();
}
