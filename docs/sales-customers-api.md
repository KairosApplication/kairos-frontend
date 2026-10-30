# Vendas e Clientes — contratos disponíveis

A página consulta clientes em `GET /api/v1/customers/list` e recomendações em `GET /api/v1/customers/{id}/recommendations?limit=10`. Exibe somente ID, nome e ID do usuário fornecidos no DTO, com busca, seleção, paginação e CSV dos resultados filtrados. O CSV escapa aspas e neutraliza fórmulas em nomes.

A aba Vendas consulta `GET /api/v1/purchases/{id}/total`, com um ID informado pelo gerente. O retorno fornece apenas ID e total. A interface não atribui cliente, data ou pagamento a essa compra, nem apresenta uma listagem/histórico ou receita por período que o endpoint não retorna.

As chamadas usam cookies e o cliente HTTP compartilhado, validam os DTOs e exibem falta de permissão, ausência de registros e nova tentativa. Recomendações e consultas de compras têm estados de erro próprios. Não há dados demonstrativos ou gravações financeiras.
