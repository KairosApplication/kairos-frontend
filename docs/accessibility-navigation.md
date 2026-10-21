# Acessibilidade: navegação e foco

Tasks KAIROS-76 e KAIROS-72; revalidação de KAIROS-77.

- Link “Pular para o conteúdo” no layout do gerente, visível ao receber foco.
- Títulos da aba específicos para Login, páginas do painel e 404.
- Foco no título da página ao mudar de caminho. Filtros, query strings, mudanças de tema e restauração de sessão em segundo plano não movem o foco.
- A restauração inicial da sessão é aguardada antes de focar o conteúdo definitivo.
- Contornos de foco também para regiões roláveis e destinos focáveis por programação.
- Testes reais de teclado para rotas, filtros, busca/notificações, modal (Tab, Shift+Tab, Escape e retorno) e rolagem de tabela.

## Executar

`npm ci`, `npx playwright install chromium`, `npm run build` e `npm run test:browser`.

No Windows com Chrome já instalado: `$env:PLAYWRIGHT_CHROME_CHANNEL='chrome'` antes do comando de testes. O preview usa a porta 4175; não reutiliza outros servidores. `npm run test` continua executando apenas os testes unitários, sem importar os arquivos Playwright.

A infraestrutura é idêntica entre as quatro PRs de acessibilidade. Cada PR acrescenta seus próprios testes e parte diretamente da main `a532b75`, sem precisar mergear outra PR aberta. As respostas de autenticação são simuladas exclusivamente nos testes e nenhum pedido é enviado ao backend real.

Isso não encerra sozinho KAIROS-76 nem declara conformidade WCAG. Faltam a matriz consolidada e a avaliação manual dos fluxos com tecnologia assistiva, previstas na PR de auditoria.
