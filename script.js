const analyzeButton = document.getElementById('analyze-button');
const statusMessage = document.getElementById('status-message');

analyzeButton.addEventListener('click', () => {
    
    analyzeButton.textContent = "Analisando...";
    analyzeButton.disabled = true;
    statusMessage.classList.remove('hidden');

    chrome.runtime.sendMessage({ type: "ANALYZE_PAGE" });
});