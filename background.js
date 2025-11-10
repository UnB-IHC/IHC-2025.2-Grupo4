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

            // Injeta o contentScript.js na aba ativa e, ao concluir, já dispara a análise
            console.log('[BG] Recebido ANALYZE_PAGE para tab', activeTab.id);

            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab.id },
                    files: ["contentScript.js"]
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error('[BG] Falha ao injetar contentScript', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        return;
                    }

                    try {
                        console.log('[BG] Script injetado, solicitando RUN_CHECKS direto');
                        // Tenta acionar a análise diretamente e devolver o relatório ao popup
                        chrome.tabs.sendMessage(activeTab.id, { type: 'RUN_CHECKS' }, (result) => {
                            if (chrome.runtime.lastError) {
                                // Se não conseguiu falar com o CS, devolve apenas success para o popup usar o fallback
                                console.warn('[BG] RUN_CHECKS direto falhou, retornando fallback', chrome.runtime.lastError);
                                sendResponse({ success: true, error: chrome.runtime.lastError.message });
                                return;
                            }
                            if (result && result.success) {
                                console.log('[BG] RUN_CHECKS retornou relatório com sucesso');
                                sendResponse({ success: true, report: result.report });
                            } else {
                                console.warn('[BG] RUN_CHECKS retornou sem sucesso', result);
                                sendResponse({ success: true, error: result?.error || 'RUN_CHECKS_FAILED' });
                            }
                        });
                    } catch (e) {
                        // Qualquer falha inesperada: mantém sucesso de injeção para o popup tentar o fallback
                        console.error('[BG] Erro inesperado ao orquestrar RUN_CHECKS', e);
                        sendResponse({ success: true, error: e && e.message ? e.message : String(e) });
                    }
                }
            );
        });

        // Importante: quando usamos sendResponse assincronamente, precisamos retornar true
        // para manter a porta de comunicação aberta até a resposta ser enviada.
        return true;
    }

    return false;
});