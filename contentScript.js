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

    function checkForSingleTitle() {
        const errors = [];
        const titles = [...document.querySelectorAll("title")];

        if (titles.length === 0) {
            errors.push(ErrorFactory.create("missing-title", "A página não possui um elemento <title>!"));
        } else if (titles.length > 1) {
            errors.push(ErrorFactory.create("multiple-titles", "A página tem múltiplas tags <title>!", titles));
        } else if (titles[0].textContent.trim() === "") {
            errors.push(ErrorFactory.create("empty-title", "O <title> da página está vazio!", titles[0]));
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
                    "O elemento <html> não possui o atributo 'lang' definido!",
                    html
                )
            );
        }

        return errors;
    }

    function checkHeadingOrder() {
        const errors = [];
        const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")];
        const myMap = new Map([
            ["h1", 1], ["h2", 2], ["h3", 3], ["h4", 4], ["h5", 5], ["h6", 6],
        ]);

        if (headings.length === 0) {
            errors.push(ErrorFactory.create("no-headings", "A página não possui headings!"));
            return errors;
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
            checkForSingleTitle,
            checkForLanguageAttribute,
            checkHeadingOrder,
        };

        const allErrors = [];

        for (let check in accessibilityChecks) {
            let result = accessibilityChecks[check]();
            allErrors.push(...result);
        }

        // 🧠 Log detalhado — clicável
        console.groupCollapsed(`♿️ ${allErrors.length} erros de acessibilidade encontrados`);
        for (const err of allErrors) {
            console.groupCollapsed(`%c${err.code}`, "color: red; font-weight: bold;");
            console.log(err.message);
            console.log("Elemento problemático:", err.element);
            console.groupEnd();
        }
        console.groupEnd();

        // 🧹 Versão limpa (sem os elementos DOM)
        const simplifiedErrors = allErrors.map(e => ({
            code: e.code,
            message: e.message,
            elementSummary: e.element ? e.element.outerHTML.slice(0, 100) + "..." : null
        }));

        chrome.runtime.sendMessage({ type: "DONE", allErrors: simplifiedErrors });
        console.log("✅ Verificações concluídas e enviadas ao background.");
    };

    window.runAccessibilityChecks();
})();
