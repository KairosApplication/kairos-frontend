# Acessibilidade: contraste e reflow

Task KAIROS-72 e revalidação de KAIROS-77.

- Bordas funcionais dos campos e botões secundários usam um token separado dos divisores decorativos.
- Cores de borda são verificadas contra o fundo real no navegador nos temas claro/escuro (mínimo 3:1); texto normal dos campos exige 4,5:1.
- Seleção do tema tem indicação de borda; a posição do switch mantém contraste entre trilha e botão.
- O verde de sucesso claro foi ajustado de #00885e para #00845f. A varredura inicial encontrou textos de Insights em aproximadamente 4,48:1.
- As linhas do mapa podem crescer com o conteúdo, preservando informações com espaçamento ampliado.
- Testes de reflow em 320 CSS pixels e espaçamento de texto em Login, 11 páginas do painel e 404, nos dois temas. Tabelas e mapas podem manter rolagem interna quando a estrutura bidimensional for necessária.

Executar: `npm run build` e `npm run test:browser`. Infraestrutura comum idêntica à das outras PRs, com autenticação simulada apenas nos testes e sem API real.

Não é uma declaração de conformidade WCAG. Zoom nativo de 200%/400%, contraste de estados adicionais e leitura ampliada ainda devem ser conferidos na matriz manual consolidada. A simulação de viewport e espaçamento não substitui todas essas verificações.
