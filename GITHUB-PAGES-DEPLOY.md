# Deploy ARTURA React (2) to GitHub Pages

Repository: https://github.com/HaruHiro123/ARTURA
Expected published URL: https://haruhiro123.github.io/ARTURA/

These URLS are targets only; deployment has not occurred yet.

## Project source

The source is based on the uploaded `React (2).zip`, under `React/artura-shop`. Existing application files and artwork are preserved. `node_modules` and `dist` were not included in this prepared ZIP because they are recreated by GitHub Actions.

Deployment-only changes:
- `vite.config.js`: base `/ARTURA/` when GITHUB_PAGES=true, otherwise `/`.
- `src/main.jsx`: BrowserRouter `basename={import.meta.env.BASE_URL}`.
- `index.html`: favicon path respects Vite base.
- `.github/workflows/deploy.yml`: automatic build + Pages deployment, 404.html SPA fallback.

## In PowerShell (open a terminal in the artura-shop directory)

```powershell
npm install
npm run lint
npm run test
npm run build
git init
git branch -M main
git add .
git commit -m "Deploy ARTURA to GitHub Pages"
git remote add origin https://github.com/HaruHiro123/ARTURA.git
git push -u origin main
```

If `git remote -v` already lists origin, do not repeat `git remote add origin`.

Then open the GitHub repository > Settings > Pages > Source: GitHub Actions. Check Actions tab for deployment. Open the URL above after a successful run.

## Caveats

GitHub Pages hosts static frontend files. The Admin demo login and browser storage are **not a secure real production backend**. Data in localStorage is not shared across users, browsers, or devices. Don't use this publicly for live orders/payments or personal data. Use only demo data for the assignment.

The copied `404.html` helps GitHub Pages SPA direct-route refresh; GitHub may still respond with HTTP status 404 for a deep link even when the UI renders.
