chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ANALYZE_PAGE") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

            const activeTab = tabs[0];

            // Primeiro injeta colorChecker.js
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ["lib/axe.min.js", "contentScript.js"]
            })
        });

        return true;
    }

    if (request.type === "DONE") {
        chrome.storage.local.set({ lastResults: request.allErrors });

        chrome.runtime.sendMessage({
            type: "ANALYSIS_COMPLETE",
            payload: request.allErrors
        });
        return true;
    }
});
