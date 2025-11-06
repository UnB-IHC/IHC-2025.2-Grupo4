chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ANALYZE_PAGE") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            if (!activeTab?.id) {
                sendResponse({ success: false, error: 'ACTIVE_TAB_NOT_FOUND' });
                return;
            }

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
        return true;
    }

    return false;
});
