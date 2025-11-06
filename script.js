/* global MockData */
const selectors = {
    root: document.querySelector('.popup'),
    analyzeButton: document.getElementById('analyze-button'),
    statusCard: document.querySelector('.status-card'),
    statusTitle: document.getElementById('status-title'),
    statusSubtitle: document.getElementById('status-subtitle'),
    lastRun: document.getElementById('last-run'),
    summaryErrors: document.getElementById('summary-errors'),
    summaryAlerts: document.getElementById('summary-alerts'),
    summaryCriteria: document.getElementById('summary-criteria'),
    findingsContainer: document.getElementById('findings-list'),
    openReport: document.getElementById('open-report'),
    checklistSelect: document.getElementById('checklist-select'),
    toast: document.getElementById('toast'),
    categoryFilter: document.getElementById('category-filter'),
    searchInput: document.getElementById('search-input'),
    historyList: document.getElementById('history-list')
};

const summaryTargets = [selectors.summaryErrors, selectors.summaryAlerts, selectors.summaryCriteria];

const appState = {
    checklist: MockData?.DEFAULT_CHECKLIST ?? 'nbr-aa',
    lastExecution: null,
    latestReport: null,
    analyzing: false,
    filters: {
        category: 'all',
        search: ''
    },
    history: []
};

function formatTimestamp(isoString, options = { dateStyle: 'short', timeStyle: 'short' }) {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleString('pt-BR', options);
    } catch (error) {
        return '—';
    }
}

function updateStatus({ title, subtitle, timestamp, state = 'idle' }) {
    selectors.statusCard.dataset.state = state;
    selectors.statusTitle.textContent = title;
    selectors.statusSubtitle.textContent = subtitle;
    selectors.lastRun.textContent = formatTimestamp(timestamp);
}

function setAnalyzingState(isAnalyzing) {
    appState.analyzing = isAnalyzing;
    selectors.analyzeButton.disabled = isAnalyzing;
    selectors.analyzeButton.textContent = isAnalyzing ? 'Analisando…' : 'Analisar página atual';
}

function showToast(message, variant = 'info') {
    if (!selectors.toast) return;
    selectors.toast.textContent = message;
    selectors.toast.dataset.variant = variant;
    selectors.toast.dataset.visible = 'true';

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        selectors.toast.dataset.visible = 'false';
    }, 2600);
}

function toggleSummarySkeleton(active) {
    summaryTargets.forEach((node) => {
        if (!node) return;
        node.classList.toggle('skeleton', active);
        if (active) {
            node.textContent = '—';
        }
    });
}

function renderSkeletonState() {
    toggleSummarySkeleton(true);
    selectors.findingsContainer.innerHTML = '';
    for (let i = 0; i < 3; i += 1) {
        const card = document.createElement('div');
        card.className = 'skeleton-card skeleton';
        selectors.findingsContainer.appendChild(card);
    }
}

function clearSkeletonState() {
    toggleSummarySkeleton(false);
}

function renderSummary(report) {
    clearSkeletonState();
    selectors.summaryErrors.textContent = report.stats.errors;
    selectors.summaryAlerts.textContent = report.stats.alerts;
    selectors.summaryCriteria.textContent = report.stats.criteria;
}

function updateCategoryOptions(findings) {
    if (!selectors.categoryFilter) return;
    const uniqueCategories = Array.from(
        new Set(
            findings
                .map((item) => item.category)
                .filter(Boolean)
        )
    ).sort();

    const current = appState.filters.category;
    selectors.categoryFilter.innerHTML = '<option value="all">Todas</option>' +
        uniqueCategories.map((category) => `<option value="${category}">${category}</option>`).join('');

    if (current !== 'all' && !uniqueCategories.includes(current)) {
        appState.filters.category = 'all';
    }

    selectors.categoryFilter.value = appState.filters.category;
}

function applyFilters(findings) {
    let filtered = findings.slice();

    if (appState.filters.category !== 'all') {
        filtered = filtered.filter((item) => item.category === appState.filters.category);
    }

    if (appState.filters.search.trim().length > 1) {
        const query = appState.filters.search.toLowerCase();
        filtered = filtered.filter((item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.selector?.toLowerCase().includes(query)
        );
    }

    return filtered;
}

function attachActionListeners(button, handler) {
    button.addEventListener('click', handler);
}

function renderFindings(report) {
    const { findings } = report;
    updateCategoryOptions(findings);
    const filtered = applyFilters(findings);

    if (!filtered.length) {
        const emptyMessage = findings.length
            ? 'Nenhum item corresponde aos filtros aplicados.'
            : 'Nenhuma não conformidade encontrada com o checklist atual.';
        selectors.findingsContainer.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((item, index) => {
        const details = document.createElement('details');
        if (index === 0) details.open = true;

        const summary = document.createElement('summary');
        const badge = document.createElement('span');
        badge.className = `badge badge--${item.severity}`;
        badge.textContent = item.severity === 'error' ? 'Erro' : item.severity === 'alert' ? 'Alerta' : 'Info';
        summary.appendChild(badge);
        summary.appendChild(document.createTextNode(item.title));

        const description = document.createElement('p');
        description.className = 'criterion';
        description.textContent = item.description;

        const meta = document.createElement('p');
        meta.className = 'meta';
        meta.textContent = item.selector ? `Elemento: ${item.selector}` : 'Elemento não identificado';

        const category = document.createElement('p');
        category.className = 'meta';
        category.textContent = item.category ? `Categoria: ${item.category}` : '';

        const recommendation = document.createElement('p');
        recommendation.className = 'meta';
        recommendation.textContent = item.recommendation ?? 'Correção em breve disponível.';

        const actions = document.createElement('div');
        actions.className = 'actions';

        const highlightButton = document.createElement('button');
        highlightButton.type = 'button';
        highlightButton.textContent = 'Destacar no DOM';
        highlightButton.ariaLabel = `Destacar ${item.selector || 'elemento'}`;

        const referenceButton = document.createElement('button');
        referenceButton.type = 'button';
        referenceButton.textContent = 'Ver referência';

        attachActionListeners(highlightButton, () => highlightElement(item.selector));
        attachActionListeners(referenceButton, () => openReference(item.references?.[0]));

        actions.appendChild(highlightButton);
        actions.appendChild(referenceButton);

        details.append(summary, description, meta);
        if (item.category) details.appendChild(category);
        details.appendChild(recommendation);

        if (item.references?.length) {
            const refs = document.createElement('p');
            refs.className = 'meta';
            refs.textContent = `Referências: ${item.references.map((ref) => ref.label).join(' · ')}`;
            details.appendChild(refs);
        }

        details.appendChild(actions);
        fragment.appendChild(details);
    });

    selectors.findingsContainer.innerHTML = '';
    selectors.findingsContainer.appendChild(fragment);
}

function renderHistory() {
    if (!selectors.historyList) return;
    if (!appState.history.length) {
        selectors.historyList.innerHTML = '<li class="history__item">Nenhuma execução registrada ainda.</li>';
        return;
    }

    const fragment = document.createDocumentFragment();
    appState.history.forEach((entry) => {
        const item = document.createElement('li');
        item.className = 'history__item';
        item.innerHTML = `
            <strong>${formatTimestamp(entry.timestamp)}</strong>
            <span>${entry.checklistLabel}</span>
            <span>${entry.stats.errors} erros · ${entry.stats.alerts} alertas</span>
        `;
        fragment.appendChild(item);
    });

    selectors.historyList.innerHTML = '';
    selectors.historyList.appendChild(fragment);
}

function getActiveReport() {
    if (appState.latestReport?.checklistId === appState.checklist) {
        return appState.latestReport;
    }
    return MockData.buildReport(appState.checklist);
}

function renderReport(report) {
    renderSummary(report);
    renderFindings(report);
}

function hydrateUI(dataFromStorage = {}) {
    appState.lastExecution = dataFromStorage.lastExecution || null;
    appState.checklist = dataFromStorage.selectedChecklist || appState.checklist;
    if (dataFromStorage.latestReport) {
        appState.latestReport = dataFromStorage.latestReport;
    }
    if (Array.isArray(dataFromStorage.history)) {
        appState.history = dataFromStorage.history;
    }

    if (selectors.checklistSelect) {
        selectors.checklistSelect.value = appState.checklist;
    }

    const report = getActiveReport();
    renderReport(report);
    renderHistory();

    updateStatus({
        title: 'Pronto para analisar',
        subtitle: 'Clique para rodar o checklist selecionado.',
        timestamp: appState.lastExecution,
        state: 'idle'
    });
}

function highlightElement(selector) {
    if (!selector) {
        showToast('Seletor indisponível para este achado.', 'warning');
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs?.[0]?.id;
        if (!tabId) {
            showToast('Abra uma aba para destacar o elemento.', 'warning');
            return;
        }

        chrome.tabs.sendMessage(tabId, { type: 'HIGHLIGHT_ELEMENT', selector }, (response) => {
            if (chrome.runtime.lastError || !response?.success) {
                showToast('Execute uma análise antes de destacar os elementos.', 'warning');
                return;
            }
            showToast('Elemento destacado na página.', 'success');
        });
    });
}

function openReference(reference) {
    if (!reference?.href) {
        showToast('Link de referência indisponível para este critério.', 'warning');
        return;
    }
    if (chrome?.tabs?.create) {
        chrome.tabs.create({ url: reference.href, active: true });
    } else {
        window.open(reference.href, '_blank');
    }
}

function updateHistory(report) {
    const entry = {
        id: `${report.checklistId}-${report.generatedAt}`,
        timestamp: report.generatedAt,
        checklistId: report.checklistId,
        checklistLabel: report.checklistLabel,
        stats: report.stats
    };
    const filteredHistory = appState.history.filter((item) => item.id !== entry.id);
    appState.history = [entry, ...filteredHistory].slice(0, 5);
    renderHistory();
}

function persistReport(report) {
    appState.latestReport = report;
    appState.lastExecution = report.generatedAt;
    updateHistory(report);
    chrome.storage.local.set({
        latestReport: report,
        lastExecution: report.generatedAt,
        selectedChecklist: appState.checklist,
        history: appState.history
    });
}

function simulateAnalysis(checklistId) {
    return new Promise((resolve) => {
        window.setTimeout(() => {
            const report = MockData.buildReport(checklistId);
            resolve(report);
        }, 1400);
    });
}

function requestAnalysis() {
    if (appState.analyzing) return;

    renderSkeletonState();
    setAnalyzingState(true);
    updateStatus({
        title: 'Checklist em andamento…',
        subtitle: 'Injetando scripts e analisando a estrutura da página.',
        timestamp: appState.lastExecution,
        state: 'progress'
    });

    chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE' }, (response) => {
        if (chrome.runtime.lastError || response?.success === false) {
            showToast('Não foi possível injetar o script na aba atual.', 'warning');
        }
    });

    simulateAnalysis(appState.checklist).then((report) => {
        persistReport(report);
        renderReport(report);
        updateStatus({
            title: 'Checklist concluído',
            subtitle: 'Veja os achados logo abaixo ou abra o relatório detalhado.',
            timestamp: report.generatedAt,
            state: 'idle'
        });
        showToast('Relatório atualizado com dados simulados.', 'info');
        setAnalyzingState(false);
    });
}

function handleChecklistChange(event) {
    const value = event.target.value;
    appState.checklist = value;
    chrome.storage.local.set({ selectedChecklist: value });
    const report = getActiveReport();
    renderReport(report);
    showToast(`Checklist ativo: ${MockData.CHECKLISTS[value]?.label ?? value}.`);
}

function handleCategoryChange(event) {
    appState.filters.category = event.target.value;
    renderFindings(getActiveReport());
}

function handleSearchInput(event) {
    appState.filters.search = event.target.value;
    renderFindings(getActiveReport());
}

function setupEventListeners() {
    selectors.analyzeButton?.addEventListener('click', requestAnalysis);

    selectors.openReport?.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open('options.html');
        }
    });

    selectors.checklistSelect?.addEventListener('change', handleChecklistChange);
    selectors.categoryFilter?.addEventListener('change', handleCategoryChange);
    selectors.searchInput?.addEventListener('input', handleSearchInput);
}

chrome.storage.local.get(['lastExecution', 'selectedChecklist', 'latestReport', 'history'], (data) => {
    hydrateUI(data);
    setupEventListeners();
});
