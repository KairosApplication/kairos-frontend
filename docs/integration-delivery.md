# Entrega da integração — frontend

Rodada de 27/10/2026. As PRs foram preparadas independentemente a partir da main `3f4ba52`, sem merges. Os módulos seguem o contrato disponível; dados demonstrativos não substituem falhas de API.

| PR | Escopo | Fonte e operações |
| --- | --- | --- |
| [55](https://github.com/KairosApplication/kairos-frontend/pull/55) | Produtos | Cadastro, edição e exclusão pelos endpoints por empresa da API #38. |
| [56](https://github.com/KairosApplication/kairos-frontend/pull/56) | Produtos nas gôndolas | Leitura do catálogo, vínculo, quantidade positiva e remoção confirmada. |
| [57](https://github.com/KairosApplication/kairos-frontend/pull/57) | Funcionários | Consulta, busca, função, paginação, cadastro, alteração de função e exclusão. |
| [58](https://github.com/KairosApplication/kairos-frontend/pull/58) | Reposição | Registros reais, responsável, data, quantidades, avarias e CRUD. |
| [59](https://github.com/KairosApplication/kairos-frontend/pull/59) | Vendas e Clientes | Clientes, recomendações, CSV e consulta do total de uma compra por ID. |
| [60](https://github.com/KairosApplication/kairos-frontend/pull/60) | Dashboard e Insights | Indicadores compartilhados do catálogo e reposições, gráfico, tabela acessível e CSV. |
| [61](https://github.com/KairosApplication/kairos-frontend/pull/61) | Perfil e Configurações | Identidade disponível, revalidação, logout e tema persistente, sem salvamentos fictícios. |
| [62](https://github.com/KairosApplication/kairos-frontend/pull/62) | KAIROS IA | Cliente das rotas pessoais do serviço Python, sem token de serviço no navegador. |
| [63](https://github.com/KairosApplication/kairos-frontend/pull/63) | Alertas e entrega | Alertas abertos vinculados ao catálogo, navegação ao mapa e documentação final. |

## Dependências de contrato

- A API #37 entrega `/store-map`; #38 entrega as gravações de produtos por empresa. Esta rodada não publica novas alterações em nenhum backend.
- Funcionários retornam IDs, nome e cargo (`manager`, `stocker`, `cashier`); envio de cargo usa o enum `MANAGER`, `STOCKER`, `CASHIER`. Presença, turno, telefone e empresa não são inferidos.
- Reposições são registros de quantidade e avarias. Não há estados de tarefa ou atribuição pendente para representar no quadro.
- Vendas fornece somente total por ID da compra. Receita por período, pagamento e histórico por cliente não podem ser preenchidos por esse contrato.
- Nome/empresa do gerente, edição de perfil/loja, outras sessões, recuperação de senha e preferências de notificações não estão expostos por contratos suficientes. A interface evita gravações simuladas.
- O chat Python possui contrato pessoal e persistência via `kairos-api-ia`. A incompatibilidade inicial com JSESSIONID foi tratada nas PRs externas `kairos-api-ia#8` e `kairos-inteligencia-artificial#9`, já mergeadas: a ponte encaminha os cookies JWT/CSRF do Spring e suas renovações. A homologação real depende dos serviços atualizados e das configurações de host/cookies/CORS. O frontend não recebe chaves de modelo ou tokens internos. Ver [contrato do chat e fontes](assistant-chat-api.md).

## Alertas

O Header consulta `/alerts/list` e `/store-map` somente quando o painel é aberto. Exibe até 20 alertas OPEN, ordenados por data/ID e vinculados a gôndolas/produtos presentes no catálogo. Não altera status nem simula leitura persistida. Escape fecha o painel e devolve foco; cada alerta abre o ID correto no mapa. Falhas não viram notificações fictícias.

## Validação e conclusão

Cada PR tem build, lint e testes dos fluxos alterados. Os testes de escrita usam HTTP simulado; não criam contas, produtos ou mensagens no banco real. A checagem integrada local reúne os commits sem merge na main, resolvendo apenas sobreposições de fixtures/testes.

Validação conjunta em 28/10/2026: lint e build aprovados; 205 testes unitários aprovados. A execução completa no Chrome aprovou 67 de 70 cenários; após corrigir um texto da fixture integrada e aguardar o foco inicial da rota nos testes de teclado, as reexecuções direcionadas aprovaram 12 de 12 cenários (incluindo os três que falharam). Os 70 cenários ficaram cobertos por essas execuções, com verificações automatizadas de acessibilidade nos dois temas. Isso não substitui homologação contra os serviços reais.

Após os merges, repetir login/expiração/logout, consulta e CRUD autorizado, filtros, paginação, gráficos/CSV, falhas de rede/permissão e respostas incertas. Confirmar que uma gravação nunca é repetida automaticamente.

Continuam necessárias validação manual com leitor de tela, zoom nativo/alto contraste e homologação com os serviços. As tasks KAIROS-72/76 não são concluídas apenas por axe/CI. Deploy exige configuração de origens/cookies e autorização de publicação.

## Consolidação

As PRs permanecem independentes e abertas para aprovação. Antes dos merges, conferir os checks dos commits atuais e preparar a ordem definitiva. Há sobreposições esperadas em `e2e/support.ts`, `e2e/forms.spec.ts` e documentação; conservar os handlers e cenários de todos os módulos ao resolver conflitos. Não substituir uma fixture integrada inteira pela versão de uma única PR.
