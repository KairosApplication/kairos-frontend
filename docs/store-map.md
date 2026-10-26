# Mapa da Loja — dados reais

A rota protegida `/mapa` adapta a mesma fonte HTTP da Gestão de Gôndolas. Contratos, operações e validação estão em [shelf-management.md](shelf-management.md). As cores, cartões, filtros e painel de detalhes preservam a estrutura visual existente.

## Organização e seleção

- Cada coluna corresponde a um corredor real, identificado por ID e posição, com seu setor. Um setor pode possuir vários corredores.
- Gôndolas ordenadas por ID dentro do corredor. `ShelfDTO.aislePosition` é a posição do **corredor**, conforme o mapper do backend; não fornece a linha física da gôndola.
- A tela informa que o mapa é esquemático. Caixas, entrada/saída e posições físicas não são simulados como dados reais.
- Cada gôndola é um botão com identificação, situação textual e `aria-pressed`. A área de corredores tem rolagem própria e pode receber foco pelo teclado em telas estreitas.
- Busca por ID, corredor ou produto e filtro por setor. A seleção acompanha os resultados visíveis; sem resultados, aparece opção de limpar filtros.
- `/mapa?gondola=ID` abre a identificação real. Se ela não existir, uma mensagem informa a ausência, sem selecionar silenciosamente outro ID. O usuário pode escolher uma gôndola visível.
- O painel apresenta todos os produtos vinculados, quantidades, capacidade e situação. O modal mostra setor, corredor, capacidade e produtos sem saldo. Escape fecha e devolve foco.

## Dados ausentes

Saldo do depósito, estoque mínimo, responsável, horário de análise e coordenadas físicas não fazem parte dos DTOs consumidos. A interface explicita as ausências pertinentes, sem preencher com exemplos. Ações de reposição fictícia foram substituídas por navegação ao cadastro real de gôndolas.

As situações **Com saldo**, **Com saldo zero** e **Sem produtos** são derivadas dos vínculos e quantidades. A legenda considera todas as gôndolas carregadas; o contador acompanha os filtros. O horário do rodapé registra a consulta no navegador.

Carregamento, falha de API/permissão, resposta inválida e resultado vazio têm feedback. Nova tentativa refaz a consulta; nunca substitui falhas por mocks.

## Verificação

Testes de componentes e de navegador cobrem corredores múltiplos por setor, identidade compartilhada com o cadastro, filtros, URL ausente, modal, foco e layouts estreitos nos dois temas. A auditoria automatizada A/AA continua incluindo mapa e formulário. A conformidade completa ainda depende da revisão manual registrada no planejamento.
