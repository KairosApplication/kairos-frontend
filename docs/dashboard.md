# Dashboard visual

## Escopo

A rota existente `/dashboard` agora apresenta os seis cards da referência fornecida: pulso da loja, atenção à operação, ritmo das vendas, prioridades, reposição em movimento e recomendação antes do pico.

Os valores são demonstrativos, com data fixa em **25/09/2026**, identificados na tela e no relatório. Estão em `src/pages/Dashboard/demo.ts`, com tipos de apresentação independentes da API. A página não consulta endpoints de vendas, estoque ou reposição.

## Interações

- **Exportar relatório:** gera CSV UTF-8 com BOM, separador `;`, decimais com vírgula, resumo do dia, reposições e os sete dias do gráfico. O arquivo se chama `kairos-dashboard-demonstrativo-2026-09-25.csv` e identifica a origem demonstrativa.
- **Ver valores por dia:** ativar o gráfico abre um modal com a tabela acessível dos valores exatos, sem depender de cor ou hover. O controle pode ser acessado por Tab e ativado por Enter/Espaço.
- **Prioridades e contadores:** navegam para `/mapa`, `/produtos` ou `/reposicoes`. Esses módulos continuam com suas páginas provisórias; esta entrega não implementa seus filtros ou dados.
- **Explorar oportunidades:** abre sugestões ilustrativas em modal, com acesso à central de reposição, controle de teclado e restauração de foco.

Os componentes `PageHeader`, `Card`, `Badge`, `Button` e `Modal` são reutilizados. O gráfico é SVG gerado dos dados, com descrição textual e tabela alternativa. Não há novas dependências ou páginas auxiliares.

## Execução e revisão

Execute `npm ci` e `npm run dev`. O Dashboard permanece dentro das rotas protegidas do gerente e exige a autenticação existente. A integração do login com a nova API JWT é uma tarefa separada; esta PR não altera esse contrato nem acrescenta um modo de contornar o login.

Os testes de componente montam a página em `MemoryRouter`. Na revisão visual automatizada, a resposta de `/auth/me` é simulada somente pelo navegador de teste, sem alterar código de produção, credenciais ou dados do banco.

Verificações: `npm run lint`, `npm run test` e `npm run build`. Os testes verificam a exportação CSV, alternativa textual do gráfico, navegação para módulos, modal e mensagens de download. A revisão no Chrome inclui download real, teclado e larguras de 1440, 1024, 768, 390 e 320px.

## Dependência de PR

A implementação utiliza os componentes da PR #26. Enquanto ela estiver aberta, a PR do Dashboard tem como base `feat/shared-ui-components`; depois do merge dos componentes, deve ser atualizada para `main`.
