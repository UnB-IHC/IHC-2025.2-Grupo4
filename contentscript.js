(() => {
    if (window.__accessibilityCheckerLoaded__) {
        console.log("♻️ Reexecuting accessibility checks...");
        window.runAccessibilityChecks();
        return;
    }

    window.__accessibilityCheckerLoaded__ = true;
    console.log("✅ Acessibility checker script loaded.");

    class ErrorFactory {
        static create(code, message, element = null, severity = "error") {
            return { code, message, element, severity };
        }
    }

    (function injectBadgeStyles() {
        if (document.getElementById('a11y-badge-styles')) return;
        const style = document.createElement('style');
        style.id = 'a11y-badge-styles';
        style.textContent = `
            .a11y-badge {
                position: absolute;
                display: inline-block;
                transform: translate(0, -100%);
                pointer-events: none;
                font-family: Arial, sans-serif;
                font-size: 11px;
                line-height: 1;
                padding: 3px 6px;
                border-radius: 4px;
                color: white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                z-index: 2147483647;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
    })();


    function isElementHidden(el) {
        if (!el) return true;

        if (el.closest('[aria-hidden="true"]')) {
            return true;
        }

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return true;
        }

        return false;
    }

    function getVisibleElements(selector) {
        const elements = [...document.querySelectorAll(selector)];
        return elements.filter(el => !isElementHidden(el));
    }

    // ============================================================
    // FUNÇÕES DE CHECAGEM DE ACESSIBILIDADE
    // ============================================================

    function mapAxeImpactToSeverity(impact) {
        const axeMap = new Map([
            ['critical', 'error'],
            ['serious', 'error'],
            ['moderate', 'warning'],
            ['minor', 'info']
        ]);

        if (axeMap.has(impact)) {
            return axeMap.get(impact) || 'warning';
        }
    }

    async function checkColorContrastWithAxe() {
        const errors = [];
        if (!window.axe) {
            errors.push(
                ErrorFactory.create(
                    "axe-not-loaded",
                    "Axe library is not loaded.",
                    null,
                    "warning"
                )
            );
            return errors;
        }

        console.log("Executing Axe for color contrast checks...");
        try {
            // Executa o Axe apenas para a regra 'color-contrast'
            const results = await window.axe.run(document.body, {
                runOnly: ['color-contrast'],
            });

            // Itera sobre as violações encontradas
            for (const violation of results.violations) {
                for (const node of violation.nodes) {
                    const severity = mapAxeImpactToSeverity(node.impact);
                    const element = document.querySelector(node.target);
                    const message = `[Axe] ${violation.help}.`;

                    errors.push(
                        ErrorFactory.create(
                            violation.id,
                            message,
                            element,
                            severity
                        )
                    );
                }
            }

        } catch (err) {
            console.error("Error when executing Axe:", err);
        }

        return errors;
    }

    async function markupValidationWithApi(timeoutMs = 6000) {
        const errors = [];
        const htmlContent = document.documentElement.outerHTML;

        // AbortController para timeout
        const controller = ('AbortController' in window) ? new AbortController() : null;
        const signal = controller ? controller.signal : undefined;
        if (controller) setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch("https://validator.w3.org/nu/?out=json", {
                method: "POST",
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Accept": "application/json",
                },
                body: htmlContent,
                signal: signal,
            });

            if (!response.ok) {
                throw new Error('Checker returned ' + response.status);
            }

            const data = await response.json();

            for (let msg of data.messages) {

                let code, severity;
                const lineInfo = msg.lastLine ? ` (line ${msg.lastLine})` : '';

                switch (msg.type) {
                    case 'error':
                        code = 'html-semantics-error';
                        severity = 'error';
                        break;
                    case 'info':
                        code = 'html-semantics-info';
                        severity = 'warning';
                        break;
                    case 'warning':
                        code = 'html-semantics-warning';
                        severity = 'warning';
                        break;
                    case 'non-document-error':
                        code = 'html-validator-error';
                        severity = 'warning';
                        break;
                    default:
                        code = 'html-semantics-unknown';
                        severity = 'info';
                }

                errors.push(
                    ErrorFactory.create(
                        code,
                        `${msg.message}${lineInfo}`,
                        null,
                        severity
                    )
                );
            }

        } catch (err) {
            errors.push(
                ErrorFactory.create(
                    "markup-validation-failed",
                    "W3C Validator Fail: " + (err && err.message ? err.message : String(err)),
                    null,
                    "warning"
                )
            );
        }

        return errors;
    }

    function checkForLanguageAttribute() {
        const errors = [];
        const html = document.documentElement;

        if (!html.hasAttribute("lang") || html.getAttribute("lang").trim() === "") {
            errors.push(
                ErrorFactory.create(
                    "missing-lang",
                    "The <html> tag doesn't have a 'lang' attribute defined.",
                    html,
                    "error"
                )
            );
        }

        return errors;
    }

    function checkForIframesWithoutTitle() {
        const errors = [];
        const iframes = getVisibleElements("iframe");

        for (let iframe of iframes) {

            if (!iframe.hasAttribute("title")) {
                errors.push(
                    ErrorFactory.create(
                        "iframe-missing-title",
                        "The <iframe> element is missing a 'title' attribute.",
                        iframe,
                        "error"
                    )
                );

            } else if (iframe.getAttribute("title").trim() === "") {
                errors.push(
                    ErrorFactory.create(
                        "iframe-empty-title",
                        "The <iframe> element has an empty 'title' attribute.",
                        iframe,
                        "warning"
                    )
                );
            }
        }

        return errors;
    }


    function checkForHeadingsHierarchy() {
        const errors = [];
        const headings = getVisibleElements("h1, h2, h3, h4, h5, h6");
        const myMap = new Map([
            ["h1", 1], ["h2", 2],
            ["h3", 3], ["h4", 4],
            ["h5", 5], ["h6", 6],
        ]);

        // Verifica se há a algum heading
        if (headings.length === 0) {
            errors.push(ErrorFactory.create("no-headings", "The page doesn't have headings."));
            return errors;
        }

        // Verifica se há múltiplos H1
        const h1s = headings.filter(h => h.tagName.toLowerCase() === 'h1');
        if (h1s.length > 1) {
            h1s.forEach(h => errors.push(ErrorFactory.create("multiple-h1-instance", "<h1> duplicated at current position.", h, "warning")));
        }

        const stack = [];

        for (let heading of headings) {
            const currentLevel = myMap.get(heading.tagName.toLowerCase());

            if (stack.length && currentLevel > stack[stack.length - 1] + 1) {
                errors.push(
                    ErrorFactory.create(
                        "invalid-heading-hierarchy",
                        `Heading jumped from <h${stack[stack.length - 1]}> to <h${currentLevel}>.`,
                        heading,
                        "warning"
                    )
                );
            }

            while (stack.length && stack[stack.length - 1] >= currentLevel) {
                stack.pop();
            }

            stack.push(currentLevel);
        }

        return errors;
    }

    function checkForImagesWithoutAlt() {
        const errors = [];
        const imgs = getVisibleElements('img');

        for (let img of imgs) {
            if (!img.hasAttribute('alt')) {
                errors.push(
                    ErrorFactory.create(
                        "img-missing-alt",
                        "Image without 'alt' attribute.",
                        img,
                        "error"
                    )
                );
            }
            else if (img.getAttribute('alt').trim() === "") {
                errors.push(
                    ErrorFactory.create(
                        "img-empty-alt",
                        "Image with empty 'alt' attribute.",
                        img,
                        "warning"
                    )
                );
            }
        }
        return errors;
    }

    function checkForFormFieldsWithoutLabel() {
        const errors = [];
        const fields = getVisibleElements(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select'
        );

        for (let field of fields) {
            if (field.getAttribute('aria-hidden') === 'true') continue;

            const id = field.id;
            const hasForLabel = id ? !!document.querySelector(`label[for="${CSS.escape(id)}"]`) : false;
            const hasWrappedLabel = !!field.closest('label');
            const hasAriaLabel = ((field.getAttribute('aria-label') || '').trim().length > 0);
            const hasAriaLabelledBy = ((field.getAttribute('aria-labelledby') || '').trim().length > 0);

            if (!hasForLabel && !hasWrappedLabel && !hasAriaLabel && !hasAriaLabelledBy) {
                errors.push(
                    ErrorFactory.create(
                        "form-field-missing-label",
                        "Form field without associated label or aria-label.",
                        field,
                        "error"
                    )
                );
            }
        }
        return errors;
    }

    function checkForComponentsWithNonDescriptiveText() {
        const errors = [];

        const genericTexts = new Set([
            "clique aqui", "saiba mais", "leia mais", "veja mais", "ver mais",
            "mais", "aqui", "link", "detalhes", "informações",
            "continue", "confira", "acesse", "explorar", "descubra",
            "ver tudo", "ver detalhes", "mais informações",
            "ler mais", "saiba", "ver", "visite",
            "click here", "read more", "learn more", "see more",
            "more info", "more information", "view more"
        ]);

        const anchors = getVisibleElements('a, button');

        for (let a of anchors) {

            const text = a.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
            const ariaLabel = (a.getAttribute('aria-label') || '').trim().toLowerCase();

            const effectiveText = text || ariaLabel;

            if (effectiveText === '') {

                const imgWithAlt = a.querySelector('img[alt]');
                if (imgWithAlt && imgWithAlt.getAttribute('alt').trim() !== '') {
                    continue;
                }

                errors.push(
                    ErrorFactory.create(
                        "component-empty-text",
                        "Component (link or button) is empty or has no accessible name.",
                        a,
                        "error"
                    )
                );
                continue;
            }

            const wordCount = effectiveText.split(/\s+/).length;
            if (genericTexts.has(effectiveText) || wordCount < 2) {
                errors.push(
                    ErrorFactory.create(
                        "component-nondescriptive-text",
                        `Component with non-descriptive text: “${effectiveText}”.`,
                        a,
                        "warning"
                    )
                );
            }
        }
        return errors;
    }

    function checkForLandmarks() {
        const errors = [];
        const landmarks = getVisibleElements('header, nav, main, aside, footer');

        if (landmarks.length == 0) {
            errors.push(
                ErrorFactory.create(
                    "no-landmarks",
                    "The page doesn't contain any landmark regions (e.g., <main>, <nav>, <header>, <footer>).",
                    null,
                    "warning"
                )
            );

            return errors;
        }

        let mainLandmarks = landmarks.filter(l => l.tagName.toLowerCase() === 'main');

        if (!mainLandmarks.length) {
            errors.push(
                ErrorFactory.create(
                    "no-main-landmark",
                    "The page doesn't contain a <main> landmark region.",
                    null,
                    "error"
                )
            );
        } else if (mainLandmarks.length > 1) {
            errors.push(
                ErrorFactory.create(
                    "multiple-main-landmarks",
                    "The page contains multiple <main> landmark regions.",
                    null,
                    "error"
                )
            );
        }
        return errors;
    }

    // ============================================================
    // FUNÇÕES DE REALCE VISUAL
    // ============================================================

    window.__a11yHighlightEnabled__ = true;
    window.__a11yBadgeMap__ = window.__a11yBadgeMap__ || new Map();
    window.__a11yResizeObserver__ = window.__a11yResizeObserver__ || (window.ResizeObserver ? new ResizeObserver(() => scheduleBadgeUpdate()) : null);
    window.__a11yUpdateRaf__ = null;

    function clearHighlights() {
        try {
            for (const [uid, { badge }] of window.__a11yBadgeMap__) {
                try { badge.remove(); } catch(e) {}
            }
            const marked = document.querySelectorAll('[data-a11y-marked="true"]');
            marked.forEach(el => {
                try {
                    el.removeAttribute('data-a11y-marked');
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                } catch (e) { /* ignora */ }
            });

            if (window.__a11yResizeObserver__) {
                try { window.__a11yResizeObserver__.disconnect(); } catch(e) {}
            }

            window.__a11yBadgeMap__.clear();

            try {
                window.removeEventListener('scroll', scheduleBadgeUpdate, { passive: true });
                window.removeEventListener('resize', scheduleBadgeUpdate);
                window.removeEventListener('orientationchange', scheduleBadgeUpdate);
            } catch(e){}

            if (window.__a11yUpdateRaf__) {
                cancelAnimationFrame(window.__a11yUpdateRaf__);
                window.__a11yUpdateRaf__ = null;
            }
        } catch (e) {
            console.error('clearHighlights error', e);
        }
    }

    function scheduleBadgeUpdate() {
        if (window.__a11yUpdateRaf__) return;
        window.__a11yUpdateRaf__ = requestAnimationFrame(() => {
            updateBadgePositions();
            window.__a11yUpdateRaf__ = null;
        });
    }

    function updateBadgePositions() {
        for (const [uid, entry] of window.__a11yBadgeMap__) {
            const { el, badge } = entry;
            if (!document.contains(el)) {
                try { badge.remove(); } catch(e){}
                if (window.__a11yResizeObserver__) {
                    try { window.__a11yResizeObserver__.unobserve(el); } catch(e){}
                }
                window.__a11yBadgeMap__.delete(uid);
                continue;
            }

            if (isElementHidden(el)) {
                try { badge.style.display = 'none'; el.style.outline = ''; } catch(e){}
                continue;
            } else {
                try { badge.style.display = ''; } catch(e){}
            }

            let rect;
            try { rect = el.getBoundingClientRect(); } catch(e) { rect = null; }
            if (rect) {
                const top = window.scrollY + Math.max(rect.top, 0);
                const left = window.scrollX + Math.max(rect.left, 0);
                badge.style.top = `${top}px`;
                badge.style.left = `${left}px`;
            }
        }
    }

    function genUid() {
        return 'a11y-' + Math.random().toString(36).slice(2,9);
    }

    function highlightElement(elOrList, severity, code) {
        if (!window.__a11yHighlightEnabled__) return;
        if (!elOrList) return;

        let nodes = null;
        if (elOrList instanceof Element) {
            nodes = [elOrList];
        } else if (NodeList.prototype.isPrototypeOf(elOrList) || Array.isArray(elOrList)) {
            nodes = Array.from(elOrList);
        } else {
            return;
        }

        const colorMap = {
            error: 'rgba(255, 0, 0, 0.85)',
            warning: 'rgba(255, 165, 0, 0.85)',
            info: 'rgba(30, 144, 255, 0.85)'
        };
        const color = (severity && colorMap[severity]) ? colorMap[severity] : colorMap.error;

        if (!window.__a11yListenersAdded__) {
            window.addEventListener('scroll', scheduleBadgeUpdate, { passive: true });
            window.addEventListener('resize', scheduleBadgeUpdate);
            window.addEventListener('orientationchange', scheduleBadgeUpdate);
            window.__a11yListenersAdded__ = true;
        }

        nodes.forEach(el => {
            if (!(el instanceof Element)) return;
            if (isElementHidden(el)) {
                return;
            }

            try {
                if (el.dataset && el.dataset.a11yMarked) {
                    const uid = el.dataset.a11yMarked;
                    const entry = window.__a11yBadgeMap__.get(uid);
                    if (entry) {
                        entry.badge.textContent = (code || 'A11Y').toUpperCase();
                        entry.badge.style.background = color;
                        el.style.outline = `3px dashed ${color}`;
                        return;
                    }
                }

                const uid = genUid();

                try { if (el.dataset) el.dataset.a11yMarked = uid; } catch(e){}
                try { el.style.outline = `3px dashed ${color}`; el.style.outlineOffset = '2px'; } catch(e) {}

                const badge = document.createElement('span');
                badge.className = 'a11y-badge';
                badge.textContent = (code || 'A11Y').toUpperCase();
                badge.setAttribute('role', 'note');
                badge.style.background = color;

                badge.style.top = '0px';
                badge.style.left = '0px';
                document.body.appendChild(badge);

                window.__a11yBadgeMap__.set(uid, { el, badge, severity, code });

                if (window.__a11yResizeObserver__) {
                    try { window.__a11yResizeObserver__.observe(el); } catch(e) {}
                }

                scheduleBadgeUpdate();

            } catch (e) {
                console.warn('highlightElement error', e);
            }
        });
    }

    // ============================================================
    // EXECUÇÃO CENTRAL
    // ============================================================

    window.runAccessibilityChecks = async () => {
        try { clearHighlights(); } catch (e) { /* ignora */ }

        // 1. Separamos as checagens por tipo
        const syncChecks = [
            checkForLanguageAttribute,
            checkForHeadingsHierarchy,
            checkForIframesWithoutTitle,
            checkForImagesWithoutAlt,
            checkForFormFieldsWithoutLabel,
            checkForComponentsWithNonDescriptiveText,
            checkForLandmarks,
        ];

        const asyncChecks = [
            markupValidationWithApi,
            checkColorContrastWithAxe
        ];

        const allErrors = [];

        // 2. Executa todas as checagens SÍNCRONAS
        console.log("Running sync checks...");
        for (const check of syncChecks) {
            try {
                const result = check(); // Retorna um Array de erros
                if (Array.isArray(result) && result.length) {
                    allErrors.push(...result);
                }
            } catch (e) {
                allErrors.push(
                    ErrorFactory.create(
                        "check-runtime-error",
                        `Error executing sync check "${check.name}": ${e.message}`,
                        null, "error"
                    )
                );
                console.error(`Checking error "${check.name}":`, e);
            }
        }

        // 3. Executa todas as checagens ASSÍNCRONAS em paralelo
        console.log("Running async checks in parallel...");
        const asyncPromises = asyncChecks.map(check => check());
        const results = await Promise.allSettled(asyncPromises);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {

                const asyncResult = result.value;

                if (Array.isArray(asyncResult) && asyncResult.length) {
                    allErrors.push(...asyncResult);
                }
            } else {
                const checkName = asyncChecks[index].name;
                allErrors.push(
                    ErrorFactory.create(
                        "check-runtime-error",
                        `Async check "${checkName}" failed: ${result.reason && result.reason.message ? result.reason.message : String(result.reason)}`,
                        null, "error"
                    )
                );
                console.error(`Async check "${checkName}" failed:`, result.reason);
            }
        });

        console.groupCollapsed(`♿️ ${allErrors.length} accessibility issues found.`);
        for (const err of allErrors) {
            const sev = err.severity || 'error';
            const color = sev === "warning" ? "orange" : (sev === "info" ? "dodgerblue" : "red");

            console.groupCollapsed(
                `%c[${sev.toUpperCase()}] ${err.code}`,
                `color:${color}; font-weight:bold;`
            );
            console.log(err.message);
            if (err.element) console.log("Problematic element:", err.element);
            console.groupEnd();

            try {
                highlightElement(err.element, sev, err.code);
            } catch(e) {
                /* ignora falhas de realce */
            }
        }
        console.groupEnd();

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "DONE", allErrors: allErrors });
        }
        console.log("✅ Checks completed.");
    };

    // Mensagens vindas do extension runtime (popup / background)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (!message || !message.type) {
                sendResponse({ success: false, error: 'INVALID_MESSAGE' });
                return;
            }

            if (message.type === 'HIGHLIGHT_ELEMENT') {
                // Aceita tanto selector quanto elementos diretamente
                if (message.selector) {
                    let nodes = [];
                    try {
                        nodes = document.querySelectorAll(message.selector);
                    } catch (e) {
                        sendResponse({ success: false, error: 'INVALID_SELECTOR' });
                        return;
                    }
                    const count = nodes.length;
                    if (count > 0) {
                        highlightElement(nodes, message.severity || 'error', message.code || 'A11Y');
                    }
                    sendResponse({ success: count > 0, count });
                    return;
                } else if (message.elementSelectorList && Array.isArray(message.elementSelectorList)) {
                    // opção para receber lista de seletores
                    const found = [];
                    for (const sel of message.elementSelectorList) {
                        try {
                            const n = document.querySelectorAll(sel);
                            n.forEach(el => found.push(el));
                        } catch(e) {}
                    }
                    highlightElement(found, message.severity || 'error', message.code || 'A11Y');
                    sendResponse({ success: found.length > 0, count: found.length });
                    return;
                } else {
                    sendResponse({ success: false, error: 'NO_SELECTOR_PROVIDED' });
                    return;
                }
            }

            if (message.type === 'RUN_CHECKS') {
                // Dispara as checagens e retorna imediatamente
                try {
                    window.runAccessibilityChecks();
                    sendResponse({ success: true });
                } catch (e) {
                    sendResponse({ success: false, error: e && e.message ? e.message : String(e) });
                }
                return;
            }

            // outros tipos podem ser adicionados
            sendResponse({ success: false, error: 'UNKNOWN_MESSAGE_TYPE' });
        } catch (e) {
            sendResponse({ success: false, error: 'HANDLER_ERROR' });
        }

        // se quiser manter o canal para uma resposta assíncrona, retornar true;
        return true;
    });

    // Executa a checagem imediatamente na injeção
    window.runAccessibilityChecks();
})();