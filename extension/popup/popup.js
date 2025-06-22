document.getElementById('closePreview').addEventListener('click', () => {
    document.getElementById('previewContainer').style.display = 'none';
});

document.getElementById('delete').addEventListener('click', () => {
    document.getElementById('results').textContent = '';
    chrome.storage.local.remove('selectedElementHtml');
});

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
    if (data.selectedElementHtml && Array.isArray(data.selectedElementHtml)) {
        const parser = new DOMParser();
        let resultsHTML = '';

        // Loop through each stored HTML string in the array
        data.selectedElementHtml.forEach((htmlString, index) => {
            const doc = parser.parseFromString(htmlString, 'text/html');
            const selectedElement = doc.body.firstChild;

            const outputPreId = `outputpre-${index}`;
            resultsHTML += `
                <div class="picked">
                    <div class="prewrapper">
                        <pre id="${outputPreId}" class="outputpre">${htmlToMarkdown(selectedElement)}</pre>
                    </div>
                    <button class="copy" data-preid="${outputPreId}">Copy</button>
                    <button class="preview" data-preid="${outputPreId}">Preview</button>
                </div>`;
        });

    
        document.getElementById('results').innerHTML = resultsHTML;

        // Add event listeners for the copy buttons
        document.querySelectorAll('.copy').forEach(copyButton => {
            copyButton.addEventListener('click', () => {
                const preId = copyButton.getAttribute('data-preid');
                const outputPre = document.getElementById(preId);

                const textToCopy = outputPre.textContent;

                navigator.clipboard.writeText(textToCopy);
            });
        });

        document.querySelectorAll('.preview').forEach(previewButton => {
            previewButton.addEventListener('click', () => {
                const preId = previewButton.getAttribute('data-preid');
                const outputPre = document.getElementById(preId);

                document.getElementById('previewer').innerHTML = outputPre.textContent;
                document.getElementById('previewContainer').style.display = 'inline';
            });
        });
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
                        if (node.parentNode.tagName.toLowerCase() !== 'li') {
                            markdown += `${processTextWithLineBreaks(node)}\n\n`;
                        } else {
                            markdown += `${processTextWithLineBreaks(node)}`;
                        }
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
                        node.childNodes.forEach(child => {
                            if (child.tagName?.toLowerCase() === 'p') {
                                markdown += `${processTextWithLineBreaks(child)}`;
                            } else {
                                processNode(child, depth);
                            }
                        });
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
                    case 'table':
                        markdown += '\n';
                        const rows = Array.from(node.querySelectorAll('tr'));
                        const headerCells = rows[0] ? Array.from(rows[0].querySelectorAll('th, td')) : [];
                        const header = headerCells.map(cell => ` ${cell.textContent.trim()} `).join('|');
                        const separator = headerCells.map(() => '---').join('|');

                        if (header) {
                            markdown += `|${header}|\n`;
                            markdown += `|${separator}|\n`;
                        }

                        rows.slice(1).forEach(row => {
                            const cells = Array.from(row.querySelectorAll('td, th')).map(cell => ` ${cell.textContent.trim()} `);
                            markdown += `|${cells.join('|')}|\n`;
                        });
                        markdown += '\n';
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
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    return markdown.trim();
}
