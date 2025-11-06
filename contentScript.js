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
        const errors = [];
        const htmlContent = document.documentElement.outerHTML;

        // Api de validação de semântica HTML
        fetch("https://validator.w3.org/nu/?out=json", {
            method: "POST",
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Accept": "application/json",
            },
            body: htmlContent
        })
        .then(response => response.json())
        .then(data => {

            // Print para teste
            // console.log(data);

            // Processa os erros e avisos retornados pela API
            data.messages.forEach(msg => {
                if (msg.type === "error" || msg.type === "warning") {
                    errors.push(
                        ErrorFactory.create(
                            "html-semantics-error",
                            `${msg.message} (linha ${msg.lastLine})`,
                        )
                    );
                }
            });
        })

        return errors;
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

    // ============================================================
    // EXECUÇÃO CENTRAL
    // ============================================================

    window.runAccessibilityChecks = () => {

        const accessibilityChecks = {
            checkForLanguageAttribute,
            checkForHeadingsHierarchy,
            checkForIframesWithoutTitle,
            markupValidationWithApi,
        };

        const allErrors = [];

        for (let check in accessibilityChecks) {
            let result = accessibilityChecks[check]();
            allErrors.push(...result);
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
