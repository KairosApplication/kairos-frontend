# Catálogo de Produtos — consulta real

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

Esta PR integra consulta e saldos nas gôndolas. Cadastro, edição, exclusão, importação, movimentação e vinculação de produtos pertencem a PRs próprias. Antes do cadastro real, o backend precisa atribuir empresa ao produto criado: o `ProductRequest`/mapper atual não preenche esse vínculo, embora os fluxos por empresa o exijam. Não enviar um `companyId` inventado nem criar produtos que desapareçam da consulta da própria empresa.

## Verificação

Testes de serviços/componentes e navegador cobrem múltiplas gôndolas por produto, saldo parcial/zero/desconhecido, preço zero, filtros, paginação, recarga, erros e navegação por ID real. O simulador HTTP existe somente em `src/test` e nos testes de navegador. A auditoria automatizada inclui página e modal nos dois temas; revisão manual completa de acessibilidade continua pendente no planejamento.
