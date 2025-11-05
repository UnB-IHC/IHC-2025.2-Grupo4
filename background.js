// Ouve por mensagens (do popup.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Verifica se a mensagem é a que esperamos
    if (request.type === "ANALYZE_PAGE") {

        // Pega a aba ativa atual
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            // Injeta o contentscript.js na aba ativa
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ["contentscript.js"]
            });
        });
    }
});