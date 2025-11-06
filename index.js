const analyzeButton = document.getElementById('analyze-button');

analyzeButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: "ANALYZE_PAGE" });
});