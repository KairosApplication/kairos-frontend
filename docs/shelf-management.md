# Gestão de Gôndolas

A rota protegida `/gondolas` implementa a listagem da captura Web (new), frame `574:518`: quatro indicadores, busca, filtros, tabela e paginação com seis registros por página.

## Escopo

- Busca por código, setor ou nome dos produtos disponíveis na demonstração, ignorando acentos, maiúsculas e espaços nas extremidades.
- Filtros combinados de setor e situação. Alterar qualquer filtro retorna à primeira página.
- Indicadores calculados para a loja inteira, preservando os mesmos dados e situações do mapa: 24 gôndolas, 3 com rupturas, 4 com estoque baixo e 17 abastecidas; 8 produtos sem exposição.
- Contador dos resultados filtrados e botões Anterior/Próxima limitados às páginas existentes.
- Estado vazio com limpeza de filtros, carregamento e erro com nova tentativa.
- Link geral ao mapa e ação por linha que abre `/mapa?gondola=CODIGO` com a gôndola selecionada.

## Fonte e limites

Os modelos em `src/types/shelfCatalog.ts` são tipos de apresentação temporários, sem impor contrato à API. `getShelfCatalog` retorna uma cópia dos dados demonstrativos, sem rede, persistência ou escrita no banco. O rodapé identifica a origem ilustrativa.

As situações vêm de `storeMapDemo`. Os seis registros iniciais e suas quantidades seguem a captura; os demais registros têm quantidades ilustrativas. A busca por nome de produto usa apenas os produtos demonstrativos preenchidos para A12, sem representar o catálogo completo.

Cadastro, edição e exclusão ficam para a próxima PR. Por isso, esta entrega apresenta a ação real de consultar no mapa e não exibe botões de CRUD ainda sem implementação. Header e Sidebar existentes são preservados.

## Verificação

`npm run lint`, `npm run test` e `npm run build` passaram, com 68 testes no projeto. Os testes cobrem indicadores, paginação, filtros combinados, retorno à primeira página, estado vazio, nova tentativa e navegação integrada para o mapa. A revisão no Chrome conferiu a captura em 1440 × 1000, alinhamento das setas, navegação por Enter ao mapa e ausência de transbordamento horizontal da página em 1024, 768, 390 e 320px. A tabela possui rolagem própria nas telas menores; a sessão foi simulada somente no navegador de teste.
