# Mapa da Loja

A rota protegida `/mapa` usa a captura enviada da seção Web (new), frame `574:277` do Figma: quatro setores, seis posições por corredor, caixas, entrada/saída e painel da gôndola selecionada.

## Comportamento

- Seleção inicial A12; cada gôndola é um botão acessível por teclado, com código, situação em texto e estado `aria-pressed`.
- Busca por código ou pelos produtos disponíveis na demonstração, ignorando acentos, maiúsculas e espaços nas extremidades. O catálogo de produtos demonstrativo está preenchido somente para A12; as outras gôndolas não simulam um catálogo completo.
- Filtro de setor combinado com a busca. As posições das gôndolas permanecem estáveis no mapa.
- Se a seleção sair dos resultados, o painel mostra a primeira gôndola visível. Sem resultados, exibe estado vazio com opção de limpar filtros.
- Legenda calculada para a loja inteira: 17 abastecidas, 4 com estoque baixo e 3 com rupturas. O contador dos filtros indica quantas estão visíveis.
- Modal de detalhes com foco, Escape e retorno ao botão de origem. Link para a rota existente da central de reposição, que ainda é provisória.

## Dados e limites

`src/types/storeMap.ts` contém tipos de apresentação, sem definir contratos da API. `src/mocks/storeMap.ts` contém os dados ilustrativos de 25/09/2026. `getStoreMap` é uma fonte temporária tipada em `services/`, sem rede, credenciais, persistência ou escrita no banco.

O rodapé identifica os dados demonstrativos. Carregamento, erro com nova tentativa e resultado vazio são tratados pela página. Edição do layout do mapa e criação real de reposições ficam para etapas próprias; o botão de edição do protótipo não é apresentado nesta entrega. A ação de criação foi substituída por navegação explícita à central, sem prometer um cadastro ainda indisponível.

## Verificação

`npm run lint`, `npm run test` e `npm run build` passaram, com 63 testes no total. Os testes cobrem filtros combinados, troca de seleção, consistência dos totais, estado vazio, falha com nova tentativa, modal e navegação. A revisão no Chrome confirmou o frame de 1440 × 1000, seleção por Enter, modal com Escape e restauração de foco, além da ausência de transbordamento horizontal em 1024, 768, 390 e 320px. A sessão foi simulada somente no navegador de teste. O Header e a Sidebar existentes não foram alterados.
