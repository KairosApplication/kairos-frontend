# Central de Reposição — cobertura visual

Referência: captura Web (new), frame `574:998`. Rota protegida `/reposicoes`.

Quadro de três colunas, prioridade, responsável, busca sem acentos, filtro de responsável e data, consulta de tarefas e modal para adicionar uma tarefa local. Os contadores refletem os sete exemplos carregados, sem apresentar os totais ilustrativos do protótipo como uma lista completa. A data é fixa em 25/09/2026; o filtro do dia anterior fica vazio.

A criação modifica somente o estado desta página e é descartada ao sair ou recarregar. Não há chamadas novas à API, persistência, atribuição real ou mudança de status no backend. Os modais reutilizam o componente acessível existente. Dados, tipos de apresentação e fonte temporária estão separados.

Esta PR nasce da `main` em `077293d`, sem depender das outras telas. O registro de rotas por arquivo e o componente VisualPage são idênticos nas PRs de cobertura visual; as telas têm arquivos próprios para evitar conflitos de integração. Nenhum merge é realizado pelo agente.
