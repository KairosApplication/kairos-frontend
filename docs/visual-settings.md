# Configurações — cobertura visual

Referência: captura Web (new), frame `574:2149`. Rota protegida `/configuracoes`.

Menu lateral com navegação por seções, dados da loja, idioma disponível em Português (Brasil), seleção ilustrativa de fuso, tema claro/escuro, switches de alertas/resumo e cartão de sessões protegidas.

O tema é uma preferência real do navegador, aplicada imediatamente em todo o site: Sidebar, Header, Login, páginas, formulários e modais. A escolha usa a chave `kairos.theme` do localStorage, permanece ao navegar/recarregar e sincroniza entre abas da mesma origem. O padrão é claro; valores inválidos são ignorados. Se o navegador bloquear armazenamento, a troca funciona durante a visita. O tema não depende da API, não é salvo na conta e não muda automaticamente com o sistema operacional.

A paleta escura segue as referências do mobile enviadas em 19/10/2026: fundo `#102019`, cartões `#1c2d27`, superfícies secundárias `#243c30` e destaques `#9ddac1`. Os tokens e as adaptações das telas ficam em `src/styles/theme.css`. O script `public/theme-init.js` aplica a preferência antes da aplicação e dos estilos para evitar um clarão claro no carregamento. Os valores iniciais devem acompanhar o ThemeProvider. As outras PRs visuais continuam independentes; seus seletores escuros já estão previstos no tema compartilhado.

Salvar altera somente o estado local dos dados da loja/notificações e informa que a loja real não foi modificada. O tema é salvo automaticamente, sem precisar desse botão. Gerenciar acessos apresenta sessões fictícias; encerrar exemplo remove somente o item da prévia, sem consultar ou revogar sessão real. A política de 30 minutos é um texto ilustrativo, não uma configuração aplicada no servidor. Recarregar ou sair restaura os exemplos da loja, mas preserva o tema. Nenhum e-mail é enviado.

PR independente criada da main `077293d`, com dados tipados e fonte temporária separada. DemoToggle é idêntico ao da PR de Perfil. Não há novos endpoints ou merge de outras telas. Apenas a preferência de tema é persistida no navegador.
