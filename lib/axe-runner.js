(async () => {
  if (!window.axe) {
    console.error("⚠️ axe-core não encontrado no contexto da página.");
    window.postMessage({ type: 'AXE_RESULTS', error: 'axe-core ausente' }, '*');
    return;
  }
  try {
    const results = await window.axe.run(document, {
      runOnly: ['color-contrast']
    });
    window.postMessage({ type: 'AXE_RESULTS', results }, '*');
  } catch (err) {
    console.error("Erro ao executar axe.run:", err);
    window.postMessage({ type: 'AXE_RESULTS', error: err.message }, '*');
  }
})();
