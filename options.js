/* global MockData */
const elements = {
    checklistSelect: document.getElementById('options-checklist'),
    severitySelect: document.getElementById('options-severity'),
    searchInput: document.getElementById('options-search'),
    exportButton: document.getElementById('export-report'),
    tableBody: document.getElementById('report-body'),
    calloutCriteria: document.getElementById('callout-criteria'),
    calloutMeta: document.getElementById('callout-meta'),
    historyList: document.getElementById('options-history')
};

const optionsState = {
    checklist: MockData?.DEFAULT_CHECKLIST ?? 'nbr-aa',
    severity: 'all',
    search: '',
    report: null,
    history: []
};

function formatTimestamp(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
}

function severityPillClass(severity) {
    if (severity === 'error') return 'status-pill error';
    if (severity === 'alert') return 'status-pill alert';
    return 'status-pill info';
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
}

function openReference(reference) {
    if (!reference?.href) return;
    if (chrome?.tabs?.create) {
        chrome.tabs.create({ url: reference.href, active: true });
    } else {
        window.open(reference.href, '_blank');
    }
}

function updateCallout(report) {
    elements.calloutCriteria.textContent = `${report.stats.criteria} critérios avaliados`;
    elements.calloutMeta.textContent = `Última análise: ${formatTimestamp(report.generatedAt)} · Checklist: ${report.checklistLabel}`;
}

function applyFilters(findings) {
    let filtered = findings.slice();

    if (optionsState.severity !== 'all') {
        filtered = filtered.filter((item) => item.severity === optionsState.severity);
    }

    if (optionsState.search.trim().length > 1) {
        const query = optionsState.search.toLowerCase();
        filtered = filtered.filter((item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.selector?.toLowerCase().includes(query)
        );
    }

    return filtered;
}

function renderTable(report) {
    const filtered = applyFilters(report.findings);

    if (!filtered.length) {
        elements.tableBody.innerHTML = '<tr><td colspan="4">Nenhum item para o filtro selecionado.</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((item) => {
        const row = document.createElement('tr');

        const criterionCell = document.createElement('td');
        criterionCell.innerHTML = `<strong>${item.title}</strong><p>${item.description}</p>`;

        const statusCell = document.createElement('td');
        statusCell.innerHTML = `<span class="${severityPillClass(item.severity)}">${item.severity === 'error' ? 'Erro' : item.severity === 'alert' ? 'Alerta' : 'Info'}</span>`;

        const referenceCell = document.createElement('td');
        referenceCell.innerHTML = (item.references || [])
            .map((reference) => `<span>${reference.label}</span>`)
            .join('<br>');

        const evidenceCell = document.createElement('td');
        const selectorSnippet = item.selector ? `<p><code>${item.selector}</code></p>` : '';
        const recommendation = item.recommendation ? `<p>${item.recommendation}</p>` : '';

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'actions';

        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.textContent = 'Copiar seletor';
        copyButton.addEventListener('click', () => copyToClipboard(item.selector));

        const referenceButton = document.createElement('button');
        referenceButton.type = 'button';
        referenceButton.textContent = 'Abrir referência';
        referenceButton.addEventListener('click', () => openReference(item.references?.[0]));

        actionsWrapper.append(copyButton, referenceButton);

        evidenceCell.innerHTML = `${selectorSnippet}${recommendation}`;
        evidenceCell.appendChild(actionsWrapper);

        row.append(criterionCell, statusCell, referenceCell, evidenceCell);
        fragment.appendChild(row);
    });

    elements.tableBody.innerHTML = '';
    elements.tableBody.appendChild(fragment);
}

function renderHistoryList() {
    if (!elements.historyList) return;
    if (!optionsState.history.length) {
        elements.historyList.innerHTML = '<li>Sem execuções registradas.</li>';
        return;
    }

    const fragment = document.createDocumentFragment();
    optionsState.history.forEach((entry) => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${formatTimestamp(entry.timestamp)}</strong><br>${entry.checklistLabel}<br>${entry.stats.errors} erros · ${entry.stats.alerts} alertas`;
        fragment.appendChild(item);
    });

    elements.historyList.innerHTML = '';
    elements.historyList.appendChild(fragment);
}

function render(report) {
    if (!report) {
        elements.tableBody.innerHTML = '<tr><td colspan="4">Nenhum dado disponível.</td></tr>';
        elements.calloutCriteria.textContent = '—';
        elements.calloutMeta.textContent = 'Sem execuções registradas.';
        return;
    }
    optionsState.report = report;
    updateCallout(report);
    renderTable(report);
    renderHistoryList();
}

function handleChecklistChange(event) {
    const selected = event.target.value;
    optionsState.checklist = selected;
    const report = MockData.buildReport(selected);
    render(report);
}

function handleSeverityChange(event) {
    optionsState.severity = event.target.value;
    render(optionsState.report);
}

function handleSearchChange(event) {
    optionsState.search = event.target.value;
    render(optionsState.report);
}

function handleExport() {
    if (!optionsState.report) return;
    const blob = new Blob([JSON.stringify(optionsState.report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `verificaaa-${optionsState.report.checklistId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
}

function bindEvents() {
    elements.checklistSelect?.addEventListener('change', handleChecklistChange);
    elements.severitySelect?.addEventListener('change', handleSeverityChange);
    elements.searchInput?.addEventListener('input', handleSearchChange);
    elements.exportButton?.addEventListener('click', handleExport);
}

function init() {
    chrome.storage.local.get(['latestReport', 'selectedChecklist', 'history'], (data) => {
        const storedChecklist = data.selectedChecklist || optionsState.checklist;
        optionsState.checklist = storedChecklist;
        if (elements.checklistSelect) {
            elements.checklistSelect.value = storedChecklist;
        }

        optionsState.history = Array.isArray(data.history) ? data.history : [];

        const report = data.latestReport?.checklistId === storedChecklist
            ? data.latestReport
            : MockData.buildReport(storedChecklist);

        render(report);
        bindEvents();
    });
}

init();
