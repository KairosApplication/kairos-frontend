# Planejamento KAIROS Web — gerente

Atualizado após a integração da listagem de gôndolas pela PR #30. As semanas representam a sequência do roadmap; não há datas de início e entrega confirmadas neste documento.

## Semana 1 — Fundação e acesso

Entregues: configuração do frontend, template de PR, validações do repositório, rotas e Not Found, layout, Sidebar, Header, Login e autenticação com Context/reducer/rotas protegidas.

A autenticação existente foi validada com a versão anterior do backend. A adaptação ao contrato JWT atualizado continua pendente. Componentes compartilhados foram integrados pela PR #26 e já são usados nas páginas.

## Semana 2 — Visão operacional

1. **Dashboard visual — entregue:** indicadores, gráfico, prioridades, andamento e CSV, com dados demonstrativos. Os dois escopos previstos originalmente para o Dashboard foram reunidos em uma entrega funcional.
2. **Mapa da Loja — entregue:** visualização, seleção, busca, setor e detalhes com fonte demonstrativa tipada.
3. **Gestão de Gôndolas — entregue:** tabela, situação, busca, filtros e paginação.
4. **Operações de gôndolas — etapa atual:** cadastro, edição e exclusão em modais, com estado demonstrativo temporário compartilhado com o mapa. Integração real depende do contrato confirmado.
5. **Produtos:** catálogo, categorias, disponibilidade, busca e filtros.
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
- Tipos de domínio da PR #25 ainda não aparecem na `main` auditada. Revisar e integrar essa entrega conforme os contratos se estabilizarem; tipos de apresentação são adicionados conforme as páginas precisam.
- Acessibilidade, feedback e testes de comportamento acompanham cada entrega.
- A meta acadêmica original é pelo menos 20 PRs reais mergeadas ao longo de quatro semanas, com planejamento inicial de 24. Números de PR incluem PRs fechadas sem merge e correções; o número #28 não comprova essa meta. Confirmar a contagem e a distribuição com o histórico do GitHub.
- A separação final das PRs depende do tamanho e da utilidade das entregas; não criar divisões artificiais para atingir a meta.
