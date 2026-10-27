# Dashboard e Insights — indicadores operacionais reais

As páginas compartilham `getOperationalAnalytics`: catálogo por empresa em `/api/v1/store-map` e registros em `/api/v1/restockings/list`. Não há cache de uma conta para outra nem fallback demonstrativo.

O catálogo fornece produtos, categorias, gôndolas, unidades vinculadas, vínculos com saldo positivo/zerado e gôndolas sem produtos. Insights mostra contagens por categoria, não participação na receita. Vínculos zerados não são contados como produtos únicos; ausência de vínculo não é uma ruptura presumida.

O período de reposição abrange hoje e os seis dias anteriores, usando a data da operação em America/Sao_Paulo. O gráfico soma quantidade reposta menos avarias por data registrada; não é gráfico de vendas nem movimentação de estoque. A tabela acessível e o CSV trazem os mesmos valores. Registros futuros e fora do intervalo são excluídos.

Se a leitura de reposições falhar, os indicadores do catálogo permanecem visíveis e o período de reposição aparece indisponível. Um retorno vazio válido produz zero; falha de consulta não é convertida em zero. Falhas de autenticação solicitam revalidação da sessão.

Receita, ticket médio, crescimento de vendas, tempo médio de reposição e previsão de demanda não são calculados sem a fonte necessária. Os relatórios exportam apenas os indicadores disponíveis, em UTF-8.
