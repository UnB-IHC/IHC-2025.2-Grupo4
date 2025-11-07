chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ANALYZE_PAGE") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

            const activeTab = tabs[0];

            // Primeiro injeta colorChecker.js
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ["contentScript.js"]
            })
        });
    }

    if (request.type === "DONE") {
        console.log("✅ A análise foi concluída!");
        console.log("Erros encontrados:", request.allErrors);
        chrome.storage.local.set({ lastResults: request.allErrors });
    }
});
