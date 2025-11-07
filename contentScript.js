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

    function markupValidationWithApi(timeoutMs = 6000) {
        return new Promise((resolve) => {
            const errors = [];
            const htmlContent = document.documentElement.outerHTML;

            // AbortController para timeout
            const controller = ('AbortController' in window) ? new AbortController() : null;
            const signal = controller ? controller.signal : undefined;
            if (controller) setTimeout(() => controller.abort(), timeoutMs);

            // API de validação de semântica HTML (W3C Nu Validator)
            fetch("https://validator.w3.org/nu/?out=json", {
                method: "POST",
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Accept": "application/json",
                },
                body: htmlContent
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Checker returned ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data && Array.isArray(data.messages)) {
                    data.messages.forEach(msg => {
                        // mapear erros e warnings do validador para o formato interno
                        const type = msg.type || 'info';
                        const code = (type === 'error') ? 'html-semantics-error' : 'html-semantics-warning';
                        const lineInfo = msg.lastLine ? ` (linha ${msg.lastLine})` : '';
                        const severity = (type === 'error') ? 'error' : (type === 'warning' ? 'warning' : 'info');
                        errors.push(
                            ErrorFactory.create(
                                code,
                                `${msg.message}${lineInfo}`,
                                null,
                                severity
                            )
                        );
                    });
                }
            })
            .catch(err => {
                errors.push(
                    ErrorFactory.create(
                        "markup-validation-failed",
                        "W3C Validator Fail: " + (err && err.message ? err.message : String(err)),
                        null,
                        "warning"
                    )
                );
            })
            .finally(() => {
                resolve(errors);
            });
        });
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
        const iframes = Array.from(document.querySelectorAll("iframe"));

        for (let iframe of iframes) {
            if (!iframe.hasAttribute("title") || iframe.getAttribute("title").trim() === "") {
                errors.push(
                    ErrorFactory.create(
                        "iframe-missing-title",
                        "The <iframe> element is missing a 'title' attribute or it is empty.",
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
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        const myMap = new Map([
            ["h1", 1], ["h2", 2], ["h3", 3], ["h4", 4], ["h5", 5], ["h6", 6],
        ]);

        // Verifica se há a algum heading
        if (headings.length === 0) {
            errors.push(ErrorFactory.create("no-headings", "The page doesn't have headings."));
            return errors;
        }

        // Verifica se há múltiplos H1
        const h1s = headings.filter(h => h.tagName.toLowerCase() === 'h1');
        if (h1s.length > 1) {
            errors.push(ErrorFactory.create("multiple-h1", "The page contains multiple <h1> tags.", null, "warning"));
            h1s.forEach(h => errors.push(ErrorFactory.create("multiple-h1-instance", "<h1> duplicated at current position.", h, "warning")));
        }

        const stack = [];

        for (let heading of headings) {
            const currentLevel = myMap.get(heading.tagName.toLowerCase());

            if (stack.length && currentLevel > stack[stack.length - 1] + 1) {
                errors.push(
                    ErrorFactory.create(
                        "invalid-heading-hierarchy",
                        `Heading jumped from <h${stack[stack.length - 1]}> to <h${currentLevel}>!`,
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
        const imgs = Array.from(document.querySelectorAll('img'));

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
                continue;
            }

            const alt = (img.getAttribute('alt') || "").trim();
            if (alt === "") {
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
        const fields = Array.from(document.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select'
        ));

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

        const anchors = [...document.querySelectorAll('a, button')];

        for (let a of anchors) {

            if (a.hasChildNodes) continue;

            const text = a.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
            const ariaLabel = (a.getAttribute('aria-label') || '').trim().toLowerCase();

            const effectiveText = text || ariaLabel;

            if (effectiveText === '') {
                errors.push(
                    ErrorFactory.create(
                        "component-empty-text",
                        "Component with empty text.",
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
        const landmarks = [...document.querySelectorAll('header, nav, main, aside, footer')];

        if (landmarks.length == 0) {
            errors.push(
                ErrorFactory.create(
                    "no-landmarks",
                    "The page doesn't contain any landmark regions (e.g., <main>, <nav>, <header>, <footer>).",
                    null,
                    "warning"
                )
            );
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

    function clearHighlights() {
        const badges = document.querySelectorAll('.a11y-badge');
        badges.forEach(b => b.remove());

        const marked = document.querySelectorAll('[data-a11y-marked="true"]');
        marked.forEach(el => {
            try {
                el.removeAttribute('data-a11y-marked');
                el.style.outline = '';
                el.style.outlineOffset = '';
            } catch (e) { /* ignora */ }
        });
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

        nodes.forEach(el => {
            if (!(el instanceof Element)) return;

            try {
                if (el.dataset && el.dataset.a11yMarked) return;
                if (el.dataset) el.dataset.a11yMarked = 'true';
            } catch (e) {}

            try { el.style.outline = `3px dashed ${color}`; el.style.outlineOffset = '2px'; } catch (e) {}

            let rect = null;
            try { rect = el.getBoundingClientRect(); } catch (e) { rect = null; }

            const badge = document.createElement('span');
            badge.className = 'a11y-badge';
            badge.textContent = (code || 'A11Y').toUpperCase();
            badge.setAttribute('role', 'note');
            badge.style.background = color;

            const top = (rect && rect.top !== undefined) ? (window.scrollY + Math.max(rect.top, 0)) : window.scrollY;
            const left = (rect && rect.left !== undefined) ? (window.scrollX + Math.max(rect.left, 0)) : window.scrollX;
            badge.style.top = `${top}px`;
            badge.style.left = `${left}px`;

            document.body.appendChild(badge);
        });
    }

    // ============================================================
    // EXECUÇÃO CENTRAL
    // ============================================================

    window.runAccessibilityChecks = async () => {
        try { clearHighlights(); } catch (e) { /* ignora */ }

        const accessibilityChecks = {
            checkForLanguageAttribute,
            checkForHeadingsHierarchy,
            checkForIframesWithoutTitle,
            checkForImagesWithoutAlt,
            checkForFormFieldsWithoutLabel,
            checkForComponentsWithNonDescriptiveText,
            markupValidationWithApi,
            checkForLandmarks,
        };

        const allErrors = [];

        for (let checkName in accessibilityChecks) {
            try {
                const result = accessibilityChecks[checkName]();

                if (result && typeof result.then === 'function') {
                    // é uma Promise -> aguarda
                    const asyncResult = await result;
                    if (Array.isArray(asyncResult) && asyncResult.length) {
                        allErrors.push(...asyncResult);
                    }
                } else {
                    // síncrono
                    if (Array.isArray(result) && result.length) {
                        allErrors.push(...result);
                    }
                }
            } catch (e) {
                // Em caso de erro em uma checagem, registre o erro e continue
                allErrors.push(
                    ErrorFactory.create(
                        "check-runtime-error",
                        `Error when executing check "${checkName}": ${e && e.message ? e.message : String(e)}`,
                        null,
                        "error"
                    )
                );
                console.error(`Checking error "${checkName}":`, e);
            }
        }

        // 🧠 Log detalhado (para testes)
        console.groupCollapsed(`♿️ ${allErrors.length} acessibility issues found.`);
        for (const err of allErrors) {
            const sev = err && err.severity ? err.severity : 'error';
            const color = sev === "warning" ? "orange" : (sev === "info" ? "dodgerblue" : "red");

            for (const err of allErrors) {
                const sev = err && err.severity ? err.severity : 'error';
                const color = sev === "warning" ? "orange" : (sev === "info" ? "dodgerblue" : "red");

                console.groupCollapsed(
                    `%c[${sev.toUpperCase()}] ${err.code}`,
                    `color:${color}; font-weight:bold;`
                );
                console.log(err.message);
                if (err.element) console.log("Problematic element:", err.element);
                console.groupEnd();

                try { highlightElement(err.element, sev, err.code); } catch (e) { /* ignora */ }
            }
            console.log(err.message);
            if (err.element) console.log("Problematic element:", err.element);
            console.groupEnd();

            try { highlightElement(err.element, err.severity || 'error', err.code); } catch(e) { /* ignora */ }
        }
        console.groupEnd();

        chrome.runtime.sendMessage({ type: "DONE", allErrors: allErrors });
        console.log("✅ Checks completed.");
    };

    window.runAccessibilityChecks();
})();
