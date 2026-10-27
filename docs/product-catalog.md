# Catálogo de Produtos — consulta e operações reais

A rota protegida `/produtos` preserva resumo, categorias, filtros, tabela, paginação e detalhes da referência visual Web (new). O conteúdo vem da empresa autenticada por `GET /api/v1/store-map`, com cookies e cliente HTTP compartilhado. Requer a [PR #37 do backend](https://github.com/KairosApplication/kairos-springboot/pull/37), ainda dependência enquanto não estiver na main da API. Não há fallback para mocks ou listagens globais.

## Contrato e adaptação

O catálogo por empresa fornece `sectors`, `aisles`, `shelves`, `products` e `productShelves`. Produtos usam `id`, `name`, `brand`, `price` e `category: { id, category }`. Os vínculos usam `productId`, `shelfId` e `productQuantity`.

`storeCatalogService` valida os DTOs, IDs únicos, referências, quantidades, categorias consistentes e posições dos corredores. A leitura e validação são compartilhadas com gôndolas/mapa. Cada carregamento faz uma única chamada; não há cache mutável de dados de uma conta para outra. `useApiData` cancela leituras antigas e solicita revalidação da sessão em 401; 403 permanece um erro de permissão no módulo.

`productCatalogService` soma as quantidades de todos os vínculos do produto e mantém cada gôndola identificada por ID. A soma precisa ser um inteiro seguro. Sem vínculo, a quantidade é `null`, não zero. Categorias são derivadas dos produtos retornados; categorias sem produtos não são conhecidas por esse contrato.

## Situações observáveis

| Situação | Condição |
| --- | --- |
| Com saldo | Todos os vínculos têm quantidade positiva. |
| Saldo parcial | Existem vínculos zerados e positivos no mesmo produto. |
| Sem saldo | Há vínculos e todos estão zerados. |
| Sem gôndola | Não há vínculos; saldo não informado. |

Os quatro indicadores, além do total, são exclusivos entre si. Saldo positivo não significa estoque suficiente ou meta atendida. Sem vínculo não é tratado como ruptura. **Ver pendências** reúne produtos com alguma gôndola zerada, incluindo saldo parcial, e limpa os filtros anteriores.

## Interface

- Busca por nome, ID ou marca, ignorando acentos, maiúsculas e espaços nas extremidades; combina categoria e situação.
- Cinco registros por página, contador de resultados e limites nos botões. Alterar filtro retorna à primeira página.
- Detalhes com ID, marca, categoria, preço, total nas gôndolas e todos os vínculos. Cada link abre `/mapa?gondola=ID` com a identificação real selecionada.
- Escape fecha o modal e restaura o foco. Tabela mantém rolagem própria acessível por teclado em telas estreitas.
- Carregamento, erro de rede/permissão/resposta inválida, nova tentativa e empresa vazia têm feedback. O rodapé mostra o momento da consulta no navegador.

## Limites e próximas entregas

SKU, código de barras, ativo/inativo, estoque mínimo e quantidade no depósito não são retornados nesta consulta e não são fabricados. A API de inventário consultada fornece identificação/setor e verificação booleana de disponibilidade para uma quantidade solicitada; isso não revela a quantidade total disponível.

Cadastro, edição e exclusão estão implementados com a correção de empresa da API na branch `fix/product-company-mutations`. Importação, movimentação e vinculação de produtos continuam pendentes.

## Operações persistentes

- Categorias do formulário vêm de `GET /api/v1/categories/list`, inclusive quando a empresa ainda não possui produtos. Essa classificação é compartilhada na API; os filtros da listagem continuam derivados do catálogo da empresa.
- Cadastro: `POST /api/v1/products/company/registration`; edição: `PATCH /api/v1/products/company/update/{id}`; exclusão: `DELETE /api/v1/products/company/delete/{id}`. Não há fallback para as rotas antigas: sem a correção da API, as novas rotas falham sem criar um produto órfão de empresa.
- Nome, marca, categoria e preço são validados conforme o contrato. Preço aceita vírgula ou ponto com até duas casas, zero e no máximo 9999999999,99, sem separador de milhar. O JSON envia preço e ID da categoria como números. ID e empresa não são enviados pelo formulário.
- A API atribui a empresa a partir do gerente autenticado; edição e exclusão validam a empresa antes de modificar o registro. Produtos legados sem empresa exigem correção no backend e não são adotados automaticamente.
- Exclusão pede confirmação e é bloqueada quando há gôndolas vinculadas conhecidas. Outros vínculos existentes no banco podem resultar em conflito, exibido no diálogo.
- Formulários preservam o rascunho em erros de validação/permissão, associam mensagens aos campos e focam o primeiro campo inválido. Durante a gravação, não é possível enviar novamente ou fechar o diálogo.
- HTTP 201/200/204 confirma a gravação, mesmo se o corpo da resposta for ilegível. Após confirmar, o catálogo é consultado novamente; falha nessa leitura não repete a gravação. Sem confirmação por falha de rede/5xx, o diálogo fecha e novas gravações ficam indisponíveis até uma consulta manual. HTTP 401 solicita revalidação da sessão; 403 preserva a sessão e mostra a falta de permissão.

Aplicar as correções do backend (`fix/map-list-query-performance` para leitura e `fix/product-company-mutations` para gravação) antes de liberar as operações. Nenhuma migração ou preenchimento de empresa em dados existentes faz parte desta entrega.

## Verificação

Testes de serviços/componentes e navegador cobrem múltiplas gôndolas por produto, saldo parcial/zero/desconhecido, preço zero, filtros, paginação, recarga, erros e navegação por ID real. O simulador HTTP existe somente em `src/test` e nos testes de navegador. A auditoria automatizada inclui página e modal nos dois temas; revisão manual completa de acessibilidade continua pendente no planejamento.
