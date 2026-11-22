# Deployment (GitHub Pages)

The workflow `.github/workflows/deploy.yml` (named `Deploy`) publishes the app and builds every pull request.
It is separate from `CI` (`docs/ci.md`) and does not change its required check.

## How it works

- The `build` job runs `npm ci` and `npm run build` with `BASE_PATH=/<repository name>/`. `vite.config.ts` reads `BASE_PATH` (default `/`), so `npm run dev` and a plain `npm run build` still serve at `/`.
- Push to `main`: `build` uploads the Pages artifact, then the `deploy` job (`needs: build`, environment `github-pages`) publishes it. A failed build skips deploy.
- Pull request: `build` uploads `dist` as the artifact `preview-pr-<number>` (kept 7 days). Nothing is deployed, and fork PRs only need read access.
- Only `deploy` has `pages: write` and `id-token: write`; everything else is `contents: read`.
- Actions are pinned to a major version tag. Logs never leave the browser; the workflow handles no log data.

Live URL: https://anthofio.github.io/Bimmerlink_visualizer/

## One-time setup (human step)

The Pages site is not configured by code. Before the first deploy can succeed, set **Settings > Pages > Build and deployment > Source** to **GitHub Actions**. If the `github-pages` environment restricts branches, allow `main`.

## Fetch a PR preview

A PR preview is a downloadable artifact, not a hosted site (Pages serves one site per repository).

```sh
gh run list --workflow deploy.yml --branch <pr-branch>
gh run download <run-id> -n preview-pr-<number> -D site/<repository-name>
npx serve site
```

The build uses the base path `/<repository-name>/` (`<repository-name>` is the name of the GitHub repository), so the unpacked `dist` must be served under that path; open `http://localhost:3000/<repository-name>/`.

## Rollback

Revert the offending commit on `main` (the push redeploys), or re-run the `Deploy` workflow of the last good commit from the Actions tab.
