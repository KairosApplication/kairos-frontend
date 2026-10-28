# KAIROS — Web do gerente

Aplicação em React, Vite e TypeScript. Para executar: `npm ci` e `npm run dev`.
O Login em `/login` usa JWT com cookies HttpOnly da versão local da API Spring Boot. Veja [contrato, configuração e limites do Login](docs/login-api.md) para configurar a URL, CORS e a conta de gerente.

Verificações: `npm run test`, `npm run lint` e `npm run build`.

## Referência do setup Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

<!-- docs-bot:start -->
## Documentação

- [Auditoria de acessibilidade — WCAG 2.1 A e AA](docs/accessibility-audit.md)
- [Acessibilidade: contraste e reflow](docs/accessibility-contrast.md)
- [Acessibilidade: formulários e mensagens](docs/accessibility-forms.md)
- [Acessibilidade: navegação e foco](docs/accessibility-navigation.md)
- [Dashboard visual](docs/dashboard.md)
- [Login do gerente](docs/login-api.md)
- [Catálogo de Produtos — consulta real](docs/product-catalog.md)
- [Planejamento KAIROS Web — gerente](docs/roadmap.md)
- [Componentes compartilhados](docs/shared-ui.md)
- [Gestão de Gôndolas — integração com a API](docs/shelf-management.md)
- [Mapa da Loja — dados reais](docs/store-map.md)
- [Funcionários — cobertura visual](docs/visual-employees.md)
- [Insights — cobertura visual](docs/visual-insights.md)
- [KAIROS IA — cobertura visual](docs/visual-kairos-ai.md)
- [Meu Perfil — identidade autenticada](docs/visual-profile.md)
- [Central de Reposição — cobertura visual](docs/visual-restocking.md)
- [Vendas & Clientes — cobertura visual](docs/visual-sales-customers.md)
- [Configurações — cobertura visual](docs/visual-settings.md)
<!-- docs-bot:end -->
