# Auditoria de acessibilidade — WCAG 2.1 A e AA

## Escopo e resultado

Base da análise: main `a532b75` (21/10/2026), Login, 11 páginas do gerente, 404, temas claro/escuro, nove diálogos e estados de vazio, conversa, erro de formulário e falha de sessão. As quatro PRs são independentes e não foram mergeadas para produzir esta entrega.

Esta PR entrega verificações automatizadas e corrige os problemas encontrados pela varredura. Não é uma declaração de conformidade. Avaliações manuais e verificação do conjunto integrado continuam necessárias antes de concluir KAIROS-72 e KAIROS-76.

### Problemas encontrados na base

- Nomes acessíveis substituíam texto visível no link de perfil, botões do mapa, cartões de reposição e acionador do gráfico. A varredura sinalizou `label-content-name-mismatch` (2.5.3).
- Dois indicadores textuais de Insights tinham contraste aproximado de 4,48:1 no tema claro (`color-contrast`, 1.4.3).

### Correções desta PR

- Nomes dos controles são derivados do conteúdo, com prefixos adicionais ocultos visualmente quando necessários. Ícones decorativos não acrescentam nomes redundantes.
- O gráfico tem um botão visível “Ver valores por dia”, separado do SVG. A tabela alternativa continua disponível por teclado e o SVG mantém título e descrição.
- Indicadores textuais de Insights usam o verde de texto, garantindo contraste sem depender da PR de controles.
- A varredura não exclui regras, elementos ou violações por baseline. São exigidas zero violações detectadas nas tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` dos estados cobertos. Resultados `incomplete` também são publicados para revisão humana.

## Executar e consultar evidências

1. `npm ci`
2. `npx playwright install chromium`
3. `npm run build`
4. `npm run test:a11y` (ou `npm run test:browser` para todos os testes de navegador).

No Windows pode-se usar `$env:PLAYWRIGHT_CHROME_CHANNEL='chrome'` com o Chrome instalado. O preview de teste usa 127.0.0.1:4175. As respostas de autenticação são simuladas somente nos testes; nenhum usuário, senha ou backend real é necessário. Isso não valida o contrato atual do backend nem a duração da sessão real.

A CI Accessibility publica o artefato `accessibility-browser-report`, com HTML, JSON das regras aprovadas/violações/resultados incompletos, screenshots e traces quando há falha. `npx playwright show-report` abre o relatório local.

## Matriz dos critérios A/AA

“Parcial” identifica evidência automatizada ou de código, sem substituir a avaliação humana. “Manual” ainda não foi executado com leitor de tela. “N/A” tem justificativa limitada ao conteúdo atual; deve ser reavaliado quando surgirem novos recursos.

| Critério | Evidência / ação | Situação |
| --- | --- | --- |
| 1.1.1 Conteúdo não textual | Logo/foto têm alternativas; ícones decorativos ocultos; gráficos têm descrição e valores. axe + revisão do sentido das alternativas. | Parcial; revisão manual |
| 1.2.1 Áudio/vídeo somente | Não há mídia de áudio/vídeo nas telas. | N/A |
| 1.2.2 Legendas gravadas | Não há vídeo gravado. | N/A |
| 1.2.3 Audiodescrição/alternativa | Não há vídeo gravado. | N/A |
| 1.2.4 Legendas ao vivo | Não há transmissão ao vivo. | N/A |
| 1.2.5 Audiodescrição gravada | Não há vídeo gravado. | N/A |
| 1.3.1 Informações e relações | Labels, cabeçalhos de tabelas, títulos e grupos; axe e testes de formulários da PR #44. | Parcial; leitura estrutural manual |
| 1.3.2 Sequência significativa | Ordem do DOM e leitura no painel responsivo. | Manual |
| 1.3.3 Características sensoriais | Revisar instruções; estados possuem texto e não dependem apenas de posição/cor. | Manual |
| 1.3.4 Orientação | Não há bloqueio de orientação; conferir retrato/paisagem e alturas reduzidas. | Parcial; manual |
| 1.3.5 Finalidade dos campos | Autocomplete de nome/e-mail/telefone no Perfil e credenciais no Login. | Parcial; manual |
| 1.4.1 Uso de cor | Status possuem texto; conferir seleção, erro e gráficos sem depender da cor. | Parcial; manual |
| 1.4.2 Controle de áudio | Não há áudio automático. | N/A |
| 1.4.3 Contraste de texto | axe em ambos os temas, incluindo estados/diálogos; correção dos indicadores de Insights. | Automatizado no escopo; estados adicionais manuais |
| 1.4.4 Redimensionar texto | Conferir zoom nativo 200% e ampliação de texto, sem perda funcional. | Manual |
| 1.4.5 Imagens de texto | Interface usa texto HTML/SVG; logo é marca e a foto é conteúdo do perfil. | Parcial; manual |
| 1.4.10 Reflow | PR #43 testa 320 CSS px; conferir zoom 400% e exceções de tabela/mapa. | Parcial; zoom nativo manual |
| 1.4.11 Contraste não textual | PR #43 mede bordas, seleção e switch; revisar todos os estados e objetos gráficos necessários. | Parcial; manual |
| 1.4.12 Espaçamento de texto | PR #43 aplica os espaçamentos de referência em todas as páginas, nos dois temas. | Parcial; revisão de cortes manual |
| 1.4.13 Conteúdo em foco/hover | Busca e notificações; conferir dispensa, permanência e acesso ao painel. | Parcial; manual |
| 2.1.1 Teclado | PR #42: rotas, busca, filtros, diálogo e tabela. PR #44: correção de campos. | Parcial; percorrer todos os fluxos |
| 2.1.2 Sem bloqueio de teclado | Tab/Shift+Tab/Escape em diálogo e retorno ao acionador; Escape nos nove diálogos nesta PR. | Parcial; manual |
| 2.1.4 Atalhos de caracteres | Não foram criados atalhos de uma única letra. | N/A no escopo atual |
| 2.2.1 Limites de tempo | A política de sessão pertence ao backend; conferir expiração, aviso e recuperação com a integração real. | Pendente de integração/avaliação |
| 2.2.2 Pausar/parar/ocultar | Revisar eventuais animações e atualizações automáticas, sem supor que dados mockados representam o comportamento final. | Manual |
| 2.3.1 Três flashes | Não há conteúdo intermitente identificado; confirmar na revisão visual. | Parcial; manual |
| 2.4.1 Ignorar blocos | Link “Pular para o conteúdo” na PR #42. | Automatizado após integração |
| 2.4.2 Título da página | Títulos por rota na PR #42, incluindo Login/404. | Automatizado após integração |
| 2.4.3 Ordem de foco | Foco de rota, preservação ao filtrar, primeiro erro e retorno de modal. | Parcial; manual |
| 2.4.4 Finalidade dos links | Conferir links de navegação, perfil, detalhes e ações em contexto. | Parcial; manual |
| 2.4.5 Múltiplas formas | Menu e busca de páginas do Header; conferir os destinos disponíveis. | Parcial; manual |
| 2.4.6 Títulos e labels | axe, grupos nomeados e campos associados; conferir clareza dos textos. | Parcial; manual |
| 2.4.7 Foco visível | Contornos existentes e extensão da PR #42; contraste da PR #43. | Parcial; manual |
| 2.5.1 Gestos de ponteiro | As ações atuais usam controles simples; não exigem gestos multiponto. | Parcial; manual |
| 2.5.2 Cancelamento de ponteiro | Ações usam clique; conferir cancelamento antes da confirmação de ações relevantes. | Parcial; manual |
| 2.5.3 Label no nome | Correções desta PR; axe verifica controles e diálogos nos dois temas. | Automatizado no escopo; voz manual |
| 2.5.4 Acionamento por movimento | Nenhuma ação exige movimentar o dispositivo. | N/A |
| 3.1.1 Idioma da página | html lang=pt-BR; axe. | Automatizado |
| 3.1.2 Idioma de partes | Conteúdo está em português; nomes próprios/códigos não são passagens em outro idioma. | Parcial; revisão editorial |
| 3.2.1 Ao receber foco | Testes de teclado; conferir ausência de mudanças inesperadas ao percorrer controles. | Parcial; manual |
| 3.2.2 Ao receber entrada | Filtros preservam foco; envio depende de ação explícita. | Parcial; manual |
| 3.2.3 Navegação consistente | Layout e ordem do menu compartilhados. | Parcial; manual |
| 3.2.4 Identificação consistente | Componentes e nomes de ações; conferir telas e estados. | Parcial; manual |
| 3.3.1 Identificação de erro | PR #44 associa erro ao campo e indica aria-invalid; Login/Gôndolas já possuem tratamento. | Parcial; manual |
| 3.3.2 Labels e instruções | Campos obrigatórios e legenda na PR #44; helpers de campos existentes. | Parcial; manual |
| 3.3.3 Sugestão de erro | PR #44: required, e-mail, duplicidade e limites numéricos. | Parcial; manual |
| 3.3.4 Prevenção de erro | Gôndolas têm confirmação de exclusão; outras escritas são demonstrativas. Reavaliar transações e alterações reais com API. | Parcial; integração/manual |
| 4.1.1 Parsing | Critério obsoleto na recomendação atual. Problemas de IDs/ARIA relevantes continuam cobertos por axe e critérios associados. | Obsoleto; não usado como dispensa de erros |
| 4.1.2 Nome, função e valor | axe, estados de switches e botões, grupos da PR #44. | Parcial; manual |
| 4.1.3 Mensagens de status | role=status/alert/log; região persistente e repetição na PR #44. | Parcial; fala real manual |

## Roteiro manual para concluir a avaliação

Registrar data, commit, sistema, versão de navegador/leitor de tela, resultado e evidência de cada item. A avaliação abaixo ainda não foi realizada nesta entrega.

- NVDA + Chrome: ler a página por títulos, landmarks, links, campos e tabelas; conferir os gráficos e a ordem de leitura no mobile.
- Usar somente teclado: pular menu, navegar pelas páginas, buscar/filtrar/paginar, abrir/cancelar/confirmar modais, selecionar gôndola, alternar tema e switches, consultar dados e baixar CSV.
- Validar erros por campo, retorno de foco, carregamento, sucesso repetido, erro de sessão e mensagens da conversa sem anúncios perdidos ou duplicados.
- Zoom nativo 200%/400%, texto ampliado, alto contraste do Windows, retrato/paisagem e espaçamento, incluindo tabelas/mapa com rolagem interna quando necessária.
- Conferir entrada/saída/expiração de sessão real quando o contrato da API estiver alinhado.
- Repetir a sequência integrada após os merges. KAIROS-72 e KAIROS-76 não devem ser concluídas apenas porque a CI está verde.

## Referências

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [W3C: avaliação automática e manual](https://www.w3.org/WAI/test-evaluate/tools/)
- [Playwright: testes de acessibilidade](https://playwright.dev/docs/accessibility-testing)
