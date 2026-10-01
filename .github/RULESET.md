# Proteção da branch padrão

O arquivo `ruleset-kairos-frontend.json` registra a proposta adaptada do ruleset do repositório `kairos-mobile`. Ele não configura o GitHub automaticamente; a proteção só entra em vigor quando um administrador a criar em **Settings → Rules → Rulesets** ou pela API do GitHub.

Antes de ativar o ruleset, execute uma PR com os workflows desta pasta e confira os nomes exatos dos checks publicados:

- `Build and lint`: instala dependências com `npm ci`, executa ESLint e valida TypeScript e build de produção.
- `Analyze JavaScript and TypeScript`: executa CodeQL.
- `Secret scan`: examina o histórico com Gitleaks.

O ruleset proposto protege a branch padrão contra exclusão e force push, exige PR com três aprovações, requer os três checks atualizados com a base e bloqueia resultados graves do CodeQL. Também reproduz as regras de GitHub Code Quality e Copilot code review do mobile. O número de aprovações segue o ruleset mobile; confirme que há revisores suficientes no frontend antes de ativá-lo.

As regras de **GitHub Code Quality** e **Copilot code review** dependem de recursos habilitados na conta ou no repositório. Confirme sua disponibilidade e remova esses dois blocos do JSON caso não estejam disponíveis antes de ativar o ruleset. O mobile também usa exclusões para branches específicas; elas não são necessárias aqui porque o alvo é apenas a branch padrão.

O projeto ainda não tem script de testes. Por isso, a CI não anuncia testes unitários até que existam testes executáveis. O baseline do Android Lint e a exceção do Gitleaks para `google-services.json` não se aplicam ao frontend.
