# Planejamento KAIROS Web — gerente

Atualizado em 27/10/2026, incluindo a correção da consulta do mapa por empresa. Autenticação JWT (#51) e identidade do perfil (#52) já foram mergeadas. As semanas abaixo registram a sequência original; a execução atual está na integração final. Não há datas de entrega confirmadas.

## Etapa atual — Integração real e entrega

Rodada final preparada em PRs independentes #55 a #62, além da PR de alertas/documentação. A [matriz de entrega](integration-delivery.md) registra o estado desta rodada e os contratos efetivamente usados. A sequência abaixo preserva o planejamento original, sem afirmar que essas PRs já foram mergeadas.

Referência atual: API main `27c15b6`, que já inclui JWT. Mapa e gôndolas requerem também a correção `fix/map-list-query-performance`, com consulta do catálogo por empresa em `/api/v1/store-map`. A referência anterior `28c73d8` usava as mesmas regras de login, mas combinava listagens globais, inadequadas para o volume real.

1. **Autenticação e identidade entregues pelas PRs #51 e #52:** JWT por cookies, cliente HTTP compartilhado, CSRF, tratamento de expiração e perfil com dados disponíveis da sessão. Renovação automática pertence ao backend. Nome e empresa reais dependem da ampliação do contrato de identidade (ver `visual-profile.md`).
2. **Gôndolas e mapa — frontend #53 mergeado:** consulta do catálogo por empresa, IDs reais, mapa esquemático e CRUD persistente. A API requer a PR #37, ainda aberta na verificação desta etapa. Ver `shelf-management.md` e `store-map.md` para limites e confirmação de gravações.
3. **Produtos — consulta entregue na #54; PR atual de operações:** cadastro, edição e exclusão com confirmação, validações, categorias reais e recarga do catálogo. Requer também a correção de empresa na API (`fix/product-company-mutations`), em PR dedicada. Quantidade no depósito, movimentação e vinculação ainda dependem de entregas próprias. Ver `product-catalog.md`.
4. Reposição e funcionários: PRs dedicadas para tarefas, responsáveis, equipe e operações disponíveis.
5. Vendas, Dashboard e Insights: mapear dados existentes, períodos e cálculos; registrar os indicadores sem fonte disponível. PRs por módulo.
6. Perfil, configurações e IA: conectar somente capacidades reais da API. Recursos sem endpoint permanecem explicitamente pendentes.
7. Validação ponta a ponta com API, teclado/leitor de tela/zoom, README e preparação de deploy. Publicação requer autorização específica.

Cada integração parte da main atualizada, preserva os tipos de apresentação e adiciona validação/adaptação dos DTOs. Dados mockados não são fallback silencioso para erro de API. Operações reais precisam de feedback e testes de falha, permissões e persistência.

### Já entregue

- Fundação, rotas, layout e componentes reutilizáveis; 12 telas (Login e 11 módulos), além de 404.
- Cobertura visual completa com dados demonstrativos e preferência de tema persistente.
- Melhorias de teclado, foco, contraste, formulários e anúncios; auditoria automatizada nos dois temas.
- As validações manuais de acessibilidade continuam pendentes; CI verde não conclui KAIROS-72/76.

## Sequência original por semanas

## Semana 1 — Fundação e acesso

Entregues: configuração do frontend, template de PR, validações do repositório, rotas e Not Found, layout, Sidebar, Header, Login e autenticação com Context/reducer/rotas protegidas.

A adaptação JWT foi entregue pela PR #51. Componentes compartilhados foram integrados pela PR #26 e já são usados nas páginas.

## Semana 2 — Visão operacional

1. **Dashboard visual — entregue:** indicadores, gráfico, prioridades, andamento e CSV, com dados demonstrativos. Os dois escopos previstos originalmente para o Dashboard foram reunidos em uma entrega funcional.
2. **Mapa da Loja — entregue:** visualização, seleção, busca, setor e detalhes com fonte demonstrativa tipada.
3. **Gestão de Gôndolas — entregue:** tabela, situação, busca, filtros e paginação.
4. **Operações de gôndolas — entregue:** cadastro, edição e exclusão em modais, com estado demonstrativo temporário compartilhado com o mapa. Integração real depende do contrato confirmado.
5. **Produtos — visual entregue:** catálogo, categorias, disponibilidade, busca, filtros e detalhes, com amostra demonstrativa de 12 produtos.
6. **Operações de produtos:** cadastro/edição e tratamento de estoque conforme contrato confirmado.

## Semana 3 — Operação e equipe

1. Central de Reposição: quadro, situação e filtros.
2. Atribuição de responsáveis e atualização de tarefas.
3. Funcionários: listagem, função, turno e filtros.
4. Funcionários: cadastro, edição e exclusão.
5. Vendas & Clientes: abas, histórico, filtros e detalhes.
6. Integração dos módulos com endpoints confirmados e revisão da autenticação JWT.

## Semana 4 — Análise e conclusão

1. Insights e gráficos analíticos.
2. KAIROS IA: conversas e mensagens; integração real depende do serviço de IA no backend.
3. Perfil do gerente e edição.
4. Configurações da loja e preferências.
5. Correções verificadas de acessibilidade, responsividade e integração.
6. Preparação da publicação, README e deploy quando autorizado.

## Regras e pendências transversais

- Uma branch e uma PR por escopo concreto, sempre com base na `main` atualizada. A dependência deve estar mergeada antes da próxima etapa.
- Priorizar interfaces independentes da API enquanto os contratos mudam. Dados demonstrativos não contam como integração concluída.
- Tipos de apresentação já estão presentes. DTOs e regras reais precisam ser conferidos no contrato da API durante a integração de cada módulo.
- Acessibilidade, feedback e testes de comportamento acompanham cada entrega.
- A meta acadêmica original é pelo menos 20 PRs reais mergeadas ao longo de quatro semanas, com planejamento inicial de 24. Números de PR incluem PRs fechadas sem merge e correções; o número #28 não comprova essa meta. Confirmar a contagem e a distribuição com o histórico do GitHub.
- A separação final das PRs depende do tamanho e da utilidade das entregas; não criar divisões artificiais para atingir a meta.
