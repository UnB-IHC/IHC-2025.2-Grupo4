const analyzeButton = document.getElementById('analyze-button');

// Adiciona um "ouvinte" de clique
analyzeButton.addEventListener('click', () => {
    // Envia uma mensagem para o background.js
    chrome.runtime.sendMessage({ type: "ANALYZE_PAGE" });
});