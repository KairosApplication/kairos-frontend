# Componentes compartilhados

## Revisar sem API

Execute `npm ci` e `npm run dev`, depois acesse **http://localhost:5173/componentes** (ajuste a porta se o Vite escolher outra).

A demonstração é exclusiva de desenvolvimento e abre sem montar o provider de autenticação: não exige login nem faz chamadas à API. Os exemplos ficam em memória e são descartados ao recarregar. A página e suas fixtures não entram no build de produção.

## Componentes

| Componente | Uso |
| --- | --- |
| `Button` | Ações primária, secundária, discreta e de atenção; `loading` bloqueia cliques. O padrão é `type="button"`; envio de formulário exige `type="submit"`. Botões somente com ícone precisam de `aria-label`. |
| `Badge` | Situação com texto e tom neutro, sucesso, atenção ou erro. Não depender somente da cor. |
| `Card` | Seção com título, descrição, ações e superfície branca, verde ou amarela. O título usa `h2`; o título da página continua em `PageHeader`. |
| `TextField` / `SelectField` | Controles nativos com label, ajuda, erro e IDs automáticos. Encaminham props nativas, eventos e refs. A validação continua sob responsabilidade do formulário. |
| `DataTable<Row>` | Colunas com renderização tipada, identificador estável, caption, cabeçalhos e rolagem horizontal acessível. Inclui carregamento, vazio e erro com nova tentativa. Filtros e paginação são controlados pela página. |
| `Feedback` | Mensagem de carregamento, vazio ou erro, com alternativa textual e nova tentativa opcional. O skeleton é estático, sem animação. |
| `Modal` | `dialog` nativo controlado por `open` e `onClose`, título e descrição associados, Escape, foco inicial e restauração de foco/rolagem. Tab/Shift+Tab circulam entre os controles visíveis; o navegador torna o restante da página inerte. |

O `Button` já é reutilizado na tentativa de verificar sessão. Os demais componentes estão exercitados na demonstração e preparados para o Dashboard e os próximos módulos.

```tsx
import Button from '../components/Button'
import Card from '../components/Card'

<Card title="Prioridades do turno" description="Comece pelo que tem mais impacto">
  <Button onClick={openDetails}>Ver detalhes</Button>
</Card>
```

## Convenções

- React, TypeScript, CSS por componente e os tokens existentes de `src/index.css`; sem dependências adicionais.
- Referências visuais: seção Web (new) e capturas fornecidas. O contexto do Figma confirmou Montserrat, superfícies claras, verde e amarelo; a segunda consulta atingiu o limite do conector. Esta PR entrega componentes, não uma reprodução da tela completa do Dashboard.
- Exemplos de apresentação pertencem a `pages/ComponentPreview/examples.ts`, sem contratos ou dependência da API.
- Não persistir dados demonstrativos nem expor a página de demonstração no menu do gerente.
- Preferir um modal por vez. Fechar o modal altera o estado da página; ações de confirmação e validação são implementadas no formulário. O backdrop não fecha o modal.
- O `Modal` usa `HTMLDialogElement.showModal()`, disponível nos navegadores modernos. Testes em jsdom simulam abertura/fechamento; contenção de foco deve ser conferida em navegador real.

## Verificações

Execute `npm run lint`, `npm run test` e `npm run build`. Testes cobrem bloqueio de ações, semântica dos campos e tabela, restauração de foco, filtros e formulário local. Revise `/componentes` em desktop e celular, incluindo Tab, Shift+Tab, Escape e estados de erro/vazio.
