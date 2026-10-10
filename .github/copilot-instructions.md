# Revisão do KAIROS Frontend

Responda em português e priorize problemas concretos introduzidos pela PR. Explique o impacto e indique o trecho relevante. Evite sugestões puramente cosméticas.

- Este repositório contém somente a aplicação web do gerente, em React, Vite e TypeScript. Verifique com `npm ci`, `npm run lint` e `npm run build`.
- Preserve o CSS e a estrutura existentes. Use arquivos `.ts` e `.tsx` para código em `src`, sem `any`.
- Mantenha chamadas de API em `services/`, tipos de domínio em `types/` e estado compartilhado em contextos ou hooks quando necessário. Não invente contratos de backend.
- Revise autenticação, autorização, persistência de sessão, falhas de rede e estados de carregamento, erro e vazio. Proteção de rota no frontend não substitui autorização no servidor.
- Não exponha tokens, senhas, dados pessoais ou chaves de IA no código, em variáveis `VITE_*`, na interface ou em logs. Identifique mocks e autenticação demonstrativa.
- Nas mudanças de interface, confira a referência da seção Web (new) do Figma, navegação por teclado, foco visível, contraste, labels e feedback de ações.
- Mudanças comportamentais relevantes precisam de testes de regressão, especialmente autenticação e atualização de dados. Não crie testes que apenas espelhem a implementação.
- Revise workflows quanto a permissões mínimas. Não use `pull_request_target` para executar código não confiável.
- A revisão automática complementa os mantenedores. Não sugira desativar a proteção da `main` para resolver falhas de CI.
