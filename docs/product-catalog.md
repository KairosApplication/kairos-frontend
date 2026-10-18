# Catálogo de Produtos

A rota protegida `/produtos` usa a captura enviada do frame Web (new) `574:759`: resumo horizontal, categorias laterais, filtros, tabela e paginação.

## Escopo

- Indicadores derivados dos 12 produtos da amostra: 10 ativos, 2 inativos, 3 com estoque baixo e 2 em ruptura. Os valores ilustrativos de 1.284 produtos do protótipo não são apresentados como dados carregados.
- Categorias com contadores gerais e seleção por botões acessíveis.
- Busca por nome, SKU ou código de barras, ignorando acentos, maiúsculas e espaços nas extremidades.
- Categoria, busca e disponibilidade combinadas. Toda alteração retorna à primeira página.
- Paginação de cinco registros, limites nos botões, contador dos resultados filtrados, estado vazio e limpeza dos filtros.
- Ver pendências limpa os filtros anteriores e reúne produtos ativos com estoque baixo ou ruptura; inativos não contam como ruptura mesmo que tenham zero unidades.
- Modal de consulta com preço, identificadores, estoque e mínimo demonstrativo, com Escape e restauração de foco.
- Link contextual para o mapa, acompanhando o código atual da gôndola caso seja renomeado no cadastro demonstrativo.
- Carregamento, erro e nova tentativa preservam o contrato assíncrono da fonte de dados.

## Dados e limites

Tipos de apresentação em `src/types/productCatalog.ts`, amostra em `src/mocks/productCatalog.ts` e fonte em `src/services/productCatalogService.ts`. Não há novos endpoints, escrita no banco, edição de estoque ou alteração do login.

A regra temporária considera inatividade antes do estoque; produtos ativos sem unidades na gôndola ficam em ruptura, abaixo do mínimo ficam com estoque baixo e os demais ficam disponíveis. Essa regra deve ser reconciliada com a API antes da integração.

A amostra não é o catálogo completo representado pelos indicadores das outras telas. As quantidades de produtos por gôndola continuam sendo exemplos da etapa anterior; esta entrega não recalcula os indicadores de estoque da loja inteira a partir desses 12 registros. Os códigos de barras também são ilustrativos e servem somente para validar busca e apresentação.

Cadastro, edição, exclusão, importação e vinculação/transferência de produtos continuam pendentes. A tabela oferece consulta, sem botões de operações ainda não implementadas. Header e Sidebar existentes são preservados.

## Verificação

Lint, build e 86 testes passaram. Os testes incluem limites da regra de disponibilidade, contadores reais da amostra, cópias isoladas, renomeação de gôndola, paginação, filtros combinados, SKU/código de barras, pendências, modal, foco, erro e navegação até o mapa.

Chrome conferido em 1440 × 1000 e sem transbordamento horizontal da página em 1024, 768, 390 e 320px. A tabela usa rolagem própria nas larguras menores. Também foram conferidos a seta centralizada do filtro, ativação do modal por Enter, Escape, retorno do foco e link para a gôndola. A sessão foi simulada apenas no navegador de teste.
