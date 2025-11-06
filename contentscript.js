const HIGHLIGHT_CLASS = 'verificaaa-highlight-outline';
const STYLE_ID = 'verificaaa-highlight-style';

function ensureStyleElement() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .${HIGHLIGHT_CLASS} {
            outline: 3px solid #f97316 !important;
            outline-offset: 4px !important;
            position: relative;
            transition: outline 0.2s ease;
        }
        .${HIGHLIGHT_CLASS}::after {
            content: 'VerificaAAA';
            position: absolute;
            top: -1.5rem;
            right: 0;
            background: #f97316;
            color: #fff;
            font-size: 0.65rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Segoe UI', sans-serif;
        }
    `;
    document.head.appendChild(style);
}

function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((node) => {
        node.classList.remove(HIGHLIGHT_CLASS);
    });
}

function highlightElements(selector) {
    if (!selector) return 0;

    ensureStyleElement();
    clearHighlights();

    let nodes;
    try {
        nodes = document.querySelectorAll(selector);
    } catch (error) {
        return 0;
    }

    nodes.forEach((node) => {
        node.classList.add(HIGHLIGHT_CLASS);
        node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });

    return nodes.length;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'HIGHLIGHT_ELEMENT') {
        const count = highlightElements(message.selector);
        sendResponse({ success: count > 0, count });
    }
});
