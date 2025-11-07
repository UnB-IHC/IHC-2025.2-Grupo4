(() => {
    if (window.__accessibilityCheckerLoaded__) {
        console.log("♻️ Reexecutando verificações de acessibilidade...");
        window.runAccessibilityChecks();
        return;
    }

    window.__accessibilityCheckerLoaded__ = true;
    console.log("✅ Script de acessibilidade carregado com sucesso.");

    class ErrorFactory {
        static create(code, message, element = null) {
            return { code, message, element };
        }
    }

    function markupValidationWithApi() {
        return new Promise((resolve) => {
            const errors = [];
            const htmlContent = document.documentElement.outerHTML;

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
                    throw new Error('Validador retornou status ' + response.status);
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
                        errors.push(
                            ErrorFactory.create(
                                code,
                                `${msg.message}${lineInfo}`
                            )
                        );
                    });
                }
            })
            .catch(err => {
                errors.push(
                    ErrorFactory.create(
                        "markup-validation-failed",
                        "Falha ao validar markup via W3C Validator: " + (err && err.message ? err.message : String(err))
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
                    "O elemento <html> não possui o atributo 'lang' definido!",
                    html
                )
            );
        }

        return errors;
    }

    function checkForIframesWithoutTitle() {
        const errors = [];
        const iframes = [...document.querySelectorAll("iframe")];

        for (let iframe of iframes) {
            if (!iframe.hasAttribute("title") || iframe.getAttribute("title").trim() === "") {
                errors.push(
                    ErrorFactory.create(
                        "iframe-missing-title",
                        "O elemento <iframe> não possui o atributo 'title' definido!",
                        iframe
                    )
                );
            }
        }

        return errors;
    }


    function checkForHeadingsHierarchy() {
        const errors = [];
        const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")];
        const myMap = new Map([
            ["h1", 1], ["h2", 2], ["h3", 3], ["h4", 4], ["h5", 5], ["h6", 6],
        ]);

        // Verifica se há a algum heading
        if (headings.length === 0) {
            errors.push(ErrorFactory.create("no-headings", "A página não possui headings!"));
            return errors;
        }

        // Verifica se há múltiplos H1
        const h1s = headings.filter(h => h.tagName.toLowerCase() === 'h1');
        if (h1s.length > 1) {
            errors.push(ErrorFactory.create("multiple-h1", "A página possui múltiplos <h1>!", h1s));
        }

        const stack = [];

        for (let heading of headings) {
            const currentLevel = myMap.get(heading.tagName.toLowerCase());

            if (stack.length && currentLevel > stack[stack.length - 1] + 1) {
                errors.push(
                    ErrorFactory.create(
                        "invalid-heading-hierarchy",
                        `Heading pulou de <h${stack[stack.length - 1]}> para <h${currentLevel}>!`,
                        heading
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
                        "Imagem sem atributo 'alt' (atributo ausente).",
                        img
                    )
                );
                continue;
            }

            const alt = (img.getAttribute('alt') || "").trim();
            if (alt === "") {
                errors.push(
                    ErrorFactory.create(
                        "img-empty-alt",
                        "Imagem com 'alt' vazio — verifique se é intencionalmente decorativa.",
                        img
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
                        "Campo de formulário sem <label> associado nem aria-label/aria-labelledby.",
                        field
                    )
                );
            }
        }
        return errors;
    }

    function checkForLinksWithNonDescriptiveText() {
        const errors = [];
        const genericTexts = new Set([
            '', 'clique aqui', 'saiba mais', 'aqui', 'leia mais', 'mais', 'ver mais', 'link', 'press here', 'click here'
        ]);

        const anchors = Array.from(document.querySelectorAll('a'));

        for (let a of anchors) {
            const href = a.getAttribute('href');
            if (!href || href.trim() === '' || /^javascript:/i.test(href.trim())) {
                // Se for ancoragem intra-página como "#id", ainda verificamos o texto — mas ignore href undefined
                // continue; // (não usamos continue aqui para também detectar anchors vazias com href ausente)
            }

            const text = (a.textContent || '').trim().toLowerCase();
            const ariaLabel = (a.getAttribute('aria-label') || '').trim();

            if (text === '' && ariaLabel === '') {
                errors.push(
                    ErrorFactory.create(
                        "link-empty-text",
                        "Link sem texto descritivo nem aria-label; verifique se tem nome acessível.",
                        a
                    )
                );
                continue;
            }

            if (genericTexts.has(text)) {
                errors.push(
                    ErrorFactory.create(
                        "link-nondescriptive-text",
                        `Link com texto não descritivo ("${text}") — prefira textos que descrevam o destino/ação.`,
                        a
                    )
                );
            }
        }
        return errors;
    }

    async function loadAxeIfNeeded() {
        if (window.axe) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('lib/axe.min.js');
            script.onload = () => {
                console.log("✅ axe-core carregado localmente");
                resolve();
            };
            script.onerror = () => reject(new Error("Falha ao carregar axe-core local"));
            document.documentElement.appendChild(script);
        });
    }

    async function checkContrastWithAxe() {
    const errors = [];
    await loadAxeIfNeeded();

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('lib/axe-runner.js');
        (document.head || document.documentElement).appendChild(script);

        window.addEventListener('message', function handler(event) {
        if (event.data.type === 'AXE_RESULTS') {
            window.removeEventListener('message', handler);

            if (event.data.error) {
                errors.push({
                    code: 'axe-error',
                    message: 'Falha ao executar axe-core: ' + event.data.error
                });

                resolve(errors);

                return;
            }

            const results = event.data.results;
                if (results && results.violations) {
                results.violations.forEach(v => {
                    v.nodes.forEach(node => {
                    errors.push({
                        code: v.id,
                        message: v.help,
                        description: v.description,
                        impact: v.impact,
                        helpUrl: v.helpUrl,
                        element: node.target?.[0] || '(elemento não identificado)',
                        html: node.html || '(sem HTML)',
                        details: node.failureSummary || ''
                    });
                });
            });
            }

            resolve(errors);
        }
        });
    });
    }


    // ============================================================
    // EXECUÇÃO CENTRAL
    // ============================================================

    window.runAccessibilityChecks = async () => {

        const accessibilityChecks = {
            checkForLanguageAttribute,
            checkForHeadingsHierarchy,
            checkForIframesWithoutTitle,
            checkForImagesWithoutAlt,
            checkForFormFieldsWithoutLabel,
            checkForLinksWithNonDescriptiveText,
            markupValidationWithApi,
            checkContrastWithAxe,
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
                        `Erro ao executar a checagem "${checkName}": ${e && e.message ? e.message : String(e)}`
                    )
                );
                console.error(`Erro em checagem ${checkName}:`, e);
            }
        }

        // 🧠 Log detalhado (para testes)
        console.groupCollapsed(`♿️ ${allErrors.length} erros de acessibilidade encontrados`);
        for (const err of allErrors) {
            console.groupCollapsed(`%c${err.code}`, "color: red; font-weight: bold;");
            console.log(err.message);
            console.log("Elemento problemático:", err.element);
            console.groupEnd();
        }
        console.groupEnd();

        chrome.runtime.sendMessage({ type: "DONE", allErrors: allErrors });
        console.log("✅ Verificações concluídas e enviadas ao background.");
    };

    window.runAccessibilityChecks();
})();
