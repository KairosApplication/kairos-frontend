# Vendas & Clientes — cobertura visual

Referência: captura Web (new), frame `574:1440`. Rota protegida `/vendas-clientes`.

Abas de vendas/clientes, resumo do dia, seis transações ilustrativas, busca, filtro de pagamento, seleção de data, painel de cliente e modais de transação e histórico. O resumo diário é o cenário ilustrativo da referência (428 vendas); a tabela é explicitamente uma amostra, não uma lista completa dessas 428 transações. O histórico também mostra somente as compras presentes na amostra.

Selecionar outro dia produz estado vazio e indicadores sem dados. O filtro textual/pagamento restringe a tabela, mantendo o resumo geral do dia. Exportar gera CSV real com BOM UTF-8 e separador `;`, contendo somente os resultados da aba e filtros atuais, identificado como demonstrativo.

Não há operações financeiras, consulta de dados pessoais reais, persistência ou novos endpoints. E-mails fictícios usam `kairos.example`. A PR parte diretamente da main `077293d`, independente das outras telas visuais; registra apenas sua própria rota.
