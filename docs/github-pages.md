# GitHub Pages

The publishing source is `gh-pages`, folder `/ (root)`. It contains only the
compiled site, not the React source. No custom domain is configured.

1. Set `VITE_API_BASE_URL` to the public HTTPS origin of Spring Boot, without
   `/api/v1`. Optionally set `VITE_AI_BASE_URL` to the public HTTPS AI origin.
   These are public build settings; never include passwords or tokens.
2. Run `npm ci` and `npm run build:pages`.
3. Publish the contents of `dist` to the root of `gh-pages`, alongside an empty
   `.nojekyll` file. Commit and push that branch to `upstream`.
4. Check the Pages build in GitHub Actions.

The `pages` build ignores `.env` files, including `.env.local`. Supply settings
through environment variables before building. Without an API origin the login
page opens, but signing in stays unavailable; no local API is contacted.

Hash routes support direct links and refreshes on static hosting:
`https://kairosapplication.github.io/kairos-frontend/#/login`.
The regular development build keeps browser routes at `http://localhost:5173`.

Allow `https://kairosapplication.github.io` in the API CORS configuration and
configure HTTPS authentication cookies for access from this origin.
Rebuild and republish whenever code or public API URLs change.
