const MockData = (() => {
    const CHECKLISTS = {
        'nbr-aa': {
            id: 'nbr-aa',
            label: 'Checklist NBR 17225 (AA)',
            totalCriteria: 24,
            description: 'Conformidade regular baseada em NBR 17225/2025 nível AA'
        },
        'wcag-a': {
            id: 'wcag-a',
            label: 'WCAG 2.2 – Nível A',
            totalCriteria: 17,
            description: 'Critérios mínimos de conformidade WCAG 2.2 nível A'
        }
    };

    const REFERENCE_LINKS = {
        'WCAG 1.1.1': 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
        'WCAG 2.4.7': 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
        'WCAG 3.3.2': 'https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html',
        'WCAG 1.4.3': 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
        'WCAG 2.5.3': 'https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html'
    };

    const MOCK_DATABASE = {
        'nbr-aa': [
            {
                id: 'img-alt',
                title: '5.2.1 Texto alternativo',
                severity: 'error',
                description: 'Imagem funcional sem descrição adequada (atributo alt ausente ou vazio).',
                selector: 'img.hero-logo',
                references: [
                    { label: 'NBR 17225 · 5.2.1', href: 'https://www.abntcatalogo.com.br/norma.aspx?ID=498052' },
                    { label: 'WCAG 1.1.1', href: REFERENCE_LINKS['WCAG 1.1.1'] }
                ],
                recommendation: 'Adicione um atributo alt descritivo que represente a função da imagem.',
                category: 'Imagens'
            },
            {
                id: 'focus-visible',
                title: '5.1.3 Foco visível',
                severity: 'alert',
                description: 'Botões secundários perdem contraste e outline ao receber foco via teclado.',
                selector: '.btn-secondary',
                references: [
                    { label: 'NBR 17225 · 5.1.3', href: 'https://www.abntcatalogo.com.br/norma.aspx?ID=498052#5.1.3' },
                    { label: 'WCAG 2.4.7', href: REFERENCE_LINKS['WCAG 2.4.7'] }
                ],
                recommendation: 'Garanta um estilo de foco com contraste mínimo de 3:1 e área visível.',
                category: 'Navegação'
            },
            {
                id: 'forms-label',
                title: '5.9.1 Rótulos de formulário',
                severity: 'error',
                description: 'Campo de e-mail não possui label visível associado ao input.',
                selector: 'input#email-newsletter',
                references: [
                    { label: 'NBR 17225 · 5.9.1', href: 'https://www.abntcatalogo.com.br/norma.aspx?ID=498052#5.9.1' },
                    { label: 'WCAG 3.3.2', href: REFERENCE_LINKS['WCAG 3.3.2'] }
                ],
                recommendation: 'Relacione o campo a um <label for="..."> ou utilize aria-labelledby.',
                category: 'Formulários'
            },
            {
                id: 'contrast-text',
                title: '5.11.2 Contraste de texto',
                severity: 'alert',
                description: 'Links no rodapé apresentam contraste 2.5:1 com o fundo.',
                selector: '.footer a',
                references: [
                    { label: 'NBR 17225 · 5.11.2', href: 'https://www.abntcatalogo.com.br/norma.aspx?ID=498052#5.11.2' },
                    { label: 'WCAG 1.4.3', href: REFERENCE_LINKS['WCAG 1.4.3'] }
                ],
                recommendation: 'Aumente o contraste para pelo menos 4.5:1 ou mude o peso/tamanho do texto.',
                category: 'Design visual'
            }
        ],
        'wcag-a': [
            {
                id: 'aria-label',
                title: '2.5.3 Nome visível',
                severity: 'alert',
                description: 'Ícone de busca possui aria-label divergente do texto visível.',
                selector: 'button#search-toggle',
                references: [
                    { label: 'WCAG 2.5.3', href: REFERENCE_LINKS['WCAG 2.5.3'] }
                ],
                recommendation: 'Garanta que o nome acessível contenha o texto apresentado ao usuário.',
                category: 'Componentes'
            },
            {
                id: 'skip-link',
                title: '2.4.1 Pular para conteúdo',
                severity: 'info',
                description: 'Não há link “Pular para o conteúdo principal” visível ao receber foco.',
                selector: 'body',
                references: [
                    { label: 'WCAG 2.4.1', href: 'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html' }
                ],
                recommendation: 'Inclua um link de pulo visível ao foco no topo da página.',
                category: 'Navegação'
            }
        ]
    };

    const DEFAULT_CHECKLIST = 'nbr-aa';

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    function buildReport(checklistId = DEFAULT_CHECKLIST) {
        const checklist = CHECKLISTS[checklistId] ?? CHECKLISTS[DEFAULT_CHECKLIST];
        const findings = clone(MOCK_DATABASE[checklist.id] ?? []);
        const stats = {
            errors: findings.filter((item) => item.severity === 'error').length,
            alerts: findings.filter((item) => item.severity === 'alert').length,
            info: findings.filter((item) => item.severity === 'info').length,
            criteria: checklist.totalCriteria
        };

        return {
            checklistId: checklist.id,
            checklistLabel: checklist.label,
            generatedAt: new Date().toISOString(),
            stats,
            findings
        };
    }

    return {
        CHECKLISTS,
        DEFAULT_CHECKLIST,
        buildReport
    };
})();
