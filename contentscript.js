(() => {
    if (window.__accessibilityCheckerLoaded__) {
        console.log("♻️ Reexecuting accessibility checks...");
        window.runAccessibilityChecks();
        return;
    }

    window.__accessibilityCheckerLoaded__ = true;
    console.log("✅ Acessibility checker script loaded.");

    class ErrorFactory {
        static create(code, message, element = null, severity = "error", extras = {}) {
            return { code, message, element, severity, ...extras };
        }
    }

    const REFERENCE_LINKS = {
        WCAG_111: {
            label: 'WCAG 1.1.1 · Conteúdo não textual',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html'
        },
        WCAG_131: {
            label: 'WCAG 1.3.1 · Informação e relacionamentos',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html'
        },
        WCAG_141: {
            label: 'WCAG 1.4.1 · Uso de cor',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html'
        },
        WCAG_143: {
            label: 'WCAG 1.4.3 · Contraste (mínimo)',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html'
        },
        WCAG_241: {
            label: 'WCAG 2.4.1 · Ignorar blocos',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html'
        },
        WCAG_244: {
            label: 'WCAG 2.4.4 · Propósito do link (em contexto)',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html'
        },
        WCAG_247: {
            label: 'WCAG 2.4.7 · Foco visível',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html'
        },
        WCAG_311: {
            label: 'WCAG 3.1.1 · Idioma da página',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html'
        },
        WCAG_332: {
            label: 'WCAG 3.3.2 · Rótulos ou instruções',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html'
        },
        WCAG_412: {
            label: 'WCAG 4.1.2 · Nome, função, valor',
            href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
        }
    };

    const ISSUE_METADATA = {
        'missing-lang': {
            title: 'Defina o atributo lang no <html>',
            category: 'Estrutura semântica',
            recommendation: 'Configure o idioma principal do documento usando lang="pt-BR" ou equivalente.',
            references: [REFERENCE_LINKS.WCAG_311]
        },
        'iframe-missing-title': {
            title: 'Iframe sem atributo title',
            category: 'Conteúdo incorporado',
            recommendation: 'Descreva o propósito de cada <iframe> no atributo title.',
            references: [REFERENCE_LINKS.WCAG_412]
        },
        'iframe-empty-title': {
            title: 'Iframe com título vazio',
            category: 'Conteúdo incorporado',
            recommendation: 'Preencha o atributo title com um texto que descreva o conteúdo embutido.',
            references: [REFERENCE_LINKS.WCAG_412]
        },
        'no-headings': {
            title: 'Nenhum heading encontrado',
            category: 'Estrutura semântica',
            recommendation: 'Utilize elementos <h1>-<h6> para organizar o conteúdo.',
            references: [REFERENCE_LINKS.WCAG_131]
        },
        'multiple-h1-instance': {
            title: 'Múltiplos elementos <h1>',
            category: 'Estrutura semântica',
            recommendation: 'Restrinja o uso de <h1> a um título principal por página.',
            references: [REFERENCE_LINKS.WCAG_131]
        },
        'invalid-heading-hierarchy': {
            title: 'Hierarquia de headings quebrada',
            category: 'Estrutura semântica',
            recommendation: 'Não salte níveis — avance de <h2> para <h3>, e assim por diante.',
            references: [REFERENCE_LINKS.WCAG_131]
        },
        'img-missing-alt': {
            title: 'Imagem sem texto alternativo',
            category: 'Imagens e mídia',
            recommendation: 'Forneça um atributo alt descrevendo a finalidade da imagem.',
            references: [REFERENCE_LINKS.WCAG_111]
        },
        'img-empty-alt': {
            title: 'Imagem com alt vazio',
            category: 'Imagens e mídia',
            recommendation: 'Substitua alt="" por um texto que represente o conteúdo mostrado.',
            references: [REFERENCE_LINKS.WCAG_111]
        },
        'form-field-missing-label': {
            title: 'Campo de formulário sem rótulo',
            category: 'Formulários',
            recommendation: 'Associe o campo a um <label> ou utilize aria-label/aria-labelledby.',
            references: [REFERENCE_LINKS.WCAG_332]
        },
        'component-empty-text': {
            title: 'Componente sem nome acessível',
            category: 'Componentes interativos',
            recommendation: 'Garanta que links e botões possuam texto visível ou aria-label descritivo.',
            references: [REFERENCE_LINKS.WCAG_244]
        },
        'component-nondescriptive-text': {
            title: 'Texto pouco descritivo',
            category: 'Componentes interativos',
            recommendation: 'Prefira rótulos que descrevam a ação em vez de “clique aqui”.',
            references: [REFERENCE_LINKS.WCAG_244]
        },
        'no-landmarks': {
            title: 'Nenhuma landmark encontrada',
            category: 'Navegação e landmarks',
            recommendation: 'Utilize regiões como <header>, <main>, <nav> e <footer> para organizar a página.',
            references: [REFERENCE_LINKS.WCAG_241]
        },
        'no-main-landmark': {
            title: 'Elemento <main> ausente',
            category: 'Navegação e landmarks',
            recommendation: 'Inclua um único <main> para indicar o conteúdo principal.',
            references: [REFERENCE_LINKS.WCAG_241]
        },
        'multiple-main-landmarks': {
            title: 'Múltiplos elementos <main>',
            category: 'Navegação e landmarks',
            recommendation: 'Restrinja-se a um <main>; use seções se precisar de múltiplos blocos.',
            references: [REFERENCE_LINKS.WCAG_241]
        },
        'html-validator-error': {
            title: 'Falha geral na validação HTML',
            category: 'Semântica HTML',
            recommendation: 'Revise a marcação conforme as orientações do validador do W3C.',
            references: [REFERENCE_LINKS.WCAG_131]
        },
        'markup-validation-failed': {
            title: 'Não foi possível validar a marcação',
            category: 'Semântica HTML',
            recommendation: 'Verifique se há bloqueios de rede ou tente novamente mais tarde.',
            references: [REFERENCE_LINKS.WCAG_131]
        },
        'color-contrast': {
            title: 'Contraste insuficiente',
            category: 'Design visual',
            recommendation: 'Ajuste cores ou peso tipográfico até atingir contraste mínimo de 4.5:1.',
            references: [REFERENCE_LINKS.WCAG_143]
        },
        'axe-not-loaded': {
            title: 'Biblioteca axe indisponível',
            category: 'Ferramentas de análise',
            recommendation: 'Garanta que o script do axe esteja acessível antes de rodar as verificações.'
        },
        'check-runtime-error': {
            title: 'Erro na execução da checagem',
            category: 'Execução da análise',
            recommendation: 'Consulte o console para mais detalhes e tente rodar novamente.'
        }
    };

    const ISSUE_METADATA_FALLBACKS = [
        {
            test: (code) => code?.startsWith('html-semantics'),
            data: {
                title: 'Inconsistência de semântica HTML',
                category: 'Semântica HTML',
                recommendation: 'Ajuste a marcação conforme a mensagem retornada pelo validador.',
                references: [REFERENCE_LINKS.WCAG_131]
            }
        }
    ];

    function getIssueMetadata(code) {
        if (code === null || code === undefined) return {};
        const normalizedCode = String(code);
        if (ISSUE_METADATA[normalizedCode]) {
            return ISSUE_METADATA[normalizedCode];
        }

        for (const fallback of ISSUE_METADATA_FALLBACKS) {
            if (fallback.test(normalizedCode)) {
                return fallback.data;
            }
        }

        if (normalizedCode.startsWith('img-')) {
            return {
                title: 'Imagem com possível problema de texto alternativo',
                category: 'Imagens e mídia'
            };
        }

        if (normalizedCode.startsWith('component-')) {
            return {
                title: 'Componente com nome pouco descritivo',
                category: 'Componentes interativos'
            };
        }

        return {};
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
                    const targetSelector = Array.isArray(node.target) ? node.target[0] : node.target;
                    let element = null;
                    if (typeof targetSelector === 'string') {
                        try {
                            element = document.querySelector(targetSelector);
                        } catch (e) {
                            element = null;
                        }
                    }
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

    function getElementSelector(el) {
        if (!(el instanceof Element)) return null;
        if (el.id) return `#${el.id}`;

        const parts = [];
        let current = el;
        let depth = 0;

        while (current && depth < 5) {
            if (!(current instanceof Element)) break;
            let part = current.tagName ? current.tagName.toLowerCase() : '';
            if (!part) break;

            if (current.classList?.length) {
                const classSegment = Array.from(current.classList)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(cls => cls.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, ''))
                    .filter(Boolean)
                    .join('.');
                if (classSegment) {
                    part += `.${classSegment}`;
                }
            }

            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(child => child.tagName === current.tagName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current);
                    part += `:nth-of-type(${index + 1})`;
                }
            }

            parts.unshift(part);
            current = current.parentElement;
            depth += 1;
        }

        return parts.join(' > ');
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

    function normalizeSeverity(severity) {
        if (severity === 'warning') return 'alert';
        if (severity === 'info') return 'info';
        return 'error';
    }

    function buildSerializableReport(errors) {
        const findings = errors.map((err, index) => {
            const severity = normalizeSeverity(err?.severity);
            const selectorFromSource = err?.selector ?? (err?.element ? getElementSelector(err.element) : null);
            const metadata = getIssueMetadata(err?.code);
            const description = err?.message ?? metadata.description ?? '';
            return {
                id: `${err?.code || 'issue'}-${index}`,
                code: err?.code ?? null,
                title: metadata.title ?? err?.code ?? 'Achado de acessibilidade',
                severity,
                description,
                selector: selectorFromSource,
                message: err?.message ?? '',
                recommendation: metadata.recommendation ?? null,
                category: metadata.category ?? null,
                references: Array.isArray(metadata.references) ? metadata.references : []
            };
        });

        const stats = {
            errors: findings.filter(item => item.severity === 'error').length,
            alerts: findings.filter(item => item.severity === 'alert').length,
            info: findings.filter(item => item.severity === 'info').length
        };

        return {
            generatedAt: new Date().toISOString(),
            stats,
            findings
        };
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

        const report = buildSerializableReport(allErrors);

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                chrome.runtime.sendMessage({ type: "CHECKS_RESULT", report });
            } catch (e) {
                console.warn('Failed to dispatch CHECKS_RESULT message', e);
            }
        }
        console.log("✅ Checks completed.");

        return report;
    };

    // Mensagens vindas do extension runtime (popup / background)
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage && typeof chrome.runtime.onMessage.addListener === "function") {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                if (!message || !message.type) {
                    sendResponse({ success: false, error: "INVALID_MESSAGE" });
                    return;
                }

                if (message.type === "HIGHLIGHT_ELEMENT") {
                    if (message.selector) {
                        let nodes = [];
                        try {
                            nodes = document.querySelectorAll(message.selector);
                        } catch (e) {
                            sendResponse({ success: false, error: "INVALID_SELECTOR" });
                            return;
                        }
                        const count = nodes.length;
                        if (count > 0) {
                            highlightElement(nodes, message.severity || "error", message.code || "A11Y");
                        }
                        sendResponse({ success: count > 0, count });
                        return;
                    } else if (message.elementSelectorList && Array.isArray(message.elementSelectorList)) {
                        const found = [];
                        for (const sel of message.elementSelectorList) {
                            try {
                                const n = document.querySelectorAll(sel);
                                n.forEach(el => found.push(el));
                            } catch (e) {}
                        }
                        highlightElement(found, message.severity || "error", message.code || "A11Y");
                        sendResponse({ success: found.length > 0, count: found.length });
                        return;
                    } else {
                        sendResponse({ success: false, error: "NO_SELECTOR_PROVIDED" });
                        return;
                    }
                }

                if (message.type === "RUN_CHECKS") {
                    window
                        .runAccessibilityChecks()
                        .then(report => sendResponse({ success: true, report }))
                        .catch(err => sendResponse({
                            success: false,
                            error: err && err.message ? err.message : String(err)
                        }));
                    return true;
                }

                sendResponse({ success: false, error: "UNKNOWN_MESSAGE_TYPE" });
            } catch (e) {
                sendResponse({ success: false, error: "HANDLER_ERROR" });
            }

            return false;
        });
    }

    // Executa a checagem imediatamente na injeção
    window.runAccessibilityChecks();
})();
