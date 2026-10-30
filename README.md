# KAIROS — Web do gerente

React, TypeScript e Vite. Node.js 24 é a referência da CI. O painel usa login de gerente, cookies HttpOnly e CSRF da API Spring Boot.

## Executar

Instale as dependências com `npm ci`. Se ainda não existir, crie `.env.local` usando `.env.example` como referência. Ajuste as origens conforme os serviços que estiverem em execução, sem `/api/v1` no final:

```dotenv
VITE_API_BASE_URL=http://localhost:8081
VITE_AI_BASE_URL=http://localhost:8000
```

```powershell
npm run dev
```

Abra a URL indicada pelo Vite e entre com uma conta real de gerente. O frontend não inicia as APIs nem cadastra uma conta automaticamente. Configure o CORS das APIs para a origem exata do frontend. Não coloque senhas, tokens de serviço ou chaves de modelos em variáveis `VITE_*`: elas são públicas no bundle.

## Verificações

```powershell
npm run lint
npm run test -- --maxWorkers=1
npm run build
npx playwright install chromium
npm run test:browser
```

No Windows, é possível usar o Chrome instalado com `$env:PLAYWRIGHT_CHROME_CHANNEL='chrome'`. Os testes de navegador iniciam um preview isolado na porta 4175 e usam respostas HTTP simuladas. Testes de escrita não devem ser apontados para o banco de produção.

## Integrações e revisão

A rodada final foi dividida em PRs independentes da main. Consulte [a matriz de entrega](docs/integration-delivery.md) para links, contratos disponíveis, verificações e limites. As PRs precisam ser aprovadas e mergeadas para as integrações aparecerem na main.

O catálogo de Mapa, Gôndolas e Produtos requer `/api/v1/store-map`, da PR #37 da API. As operações de produtos usam as rotas por empresa da PR #38 da API. As demais integrações usam somente os endpoints existentes. O cliente de IA usa as rotas pessoais do serviço Python; a compatibilidade de autenticação entre Python e Spring precisa ser validada pelos serviços.

## Build e publicação

`npm run build` gera `dist`. As variáveis `VITE_*` são incorporadas durante esse build; alterar somente o ambiente do servidor depois não atualiza o bundle. Para conferir o resultado, execute `npm run preview`.

A hospedagem deve servir `index.html` nas rotas da aplicação, incluindo `/dashboard`, `/mapa` e `/produtos`. As APIs precisam de HTTPS, origens autorizadas e políticas de cookie compatíveis com a topologia de implantação. A publicação não é realizada pelas PRs desta rodada.

## Documentação

- [Login e autenticação](docs/login-api.md)
- [Mapa da Loja](docs/store-map.md)
- [Gestão de Gôndolas](docs/shelf-management.md)
- [Catálogo de Produtos](docs/product-catalog.md)
- [Planejamento](docs/roadmap.md)
- [Componentes compartilhados](docs/shared-ui.md)
- [Avaliação de acessibilidade e roteiro manual](docs/accessibility-audit.md)
- [Matriz da integração final](docs/integration-delivery.md)
