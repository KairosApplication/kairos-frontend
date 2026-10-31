# Dashboard e Insights — indicadores operacionais reais

O Dashboard consulta o catálogo por empresa em `/api/v1/store-map` para rupturas e prioridades. Mantém os cards de receita, ritmo das vendas e estados das tarefas previstos no design, com valores indisponíveis enquanto essas fontes não estiverem integradas. Não usa contagens de catálogo ou reposições para preencher indicadores de vendas. Insights usa também os registros em `/api/v1/restockings/list`. Não há cache de uma conta para outra nem fallback demonstrativo.

O catálogo fornece produtos, categorias, gôndolas, unidades vinculadas e vínculos com saldo positivo/zerado. O Dashboard conta produtos distintos com saldo zero em alguma gôndola e agrupa as prioridades por gôndola. Insights mostra participação no catálogo, não participação na receita; quando há mais de quatro categorias, as três primeiras e o grupo agregado das restantes preservam os totais. Ausência de vínculo não é uma ruptura presumida.

O período de reposição de Insights abrange hoje e os seis dias anteriores, usando a data da operação em America/Sao_Paulo. Registros futuros e fora do intervalo são excluídos. O Dashboard não consulta esse histórico para preencher o gráfico de vendas ou inferir estados de tarefas.

Se a leitura de reposições falhar, os indicadores do catálogo permanecem visíveis e o período de reposição aparece indisponível. Um retorno vazio válido produz zero; falha de consulta não é convertida em zero. Falhas de autenticação solicitam revalidação da sessão.

Receita, ticket médio, crescimento de vendas, tempo médio de reposição e previsão de demanda não são calculados sem a fonte necessária. Os relatórios exportam apenas os indicadores disponíveis, em UTF-8.
