// background.js
// Ouve por mensagens (do popup.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Verifica se a mensagem é a que esperamos
    if (request.type === "ANALYZE_PAGE") {

        // Pega a aba ativa atual
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            if (!activeTab?.id) {
                sendResponse({ success: false, error: 'ACTIVE_TAB_NOT_FOUND' });
                return;
            }

            // Injeta o contentscript.js na aba ativa
            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab.id },
                    files: ["contentscript.js"]
                },
                () => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        return;
                    }

                    sendResponse({ success: true });
                }
            );
        });

        // Importante: quando usamos sendResponse assincronamente, precisamos retornar true
        // para manter a porta de comunicação aberta até a resposta ser enviada.
        return true;
    }

    return false;
});