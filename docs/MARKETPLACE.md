# GitHub Marketplace — publication checklist

Repo: [abecms/visualq-action](https://github.com/abecms/visualq-action)

**État actuel (juin 2026)** : release `v1.0.0` + tag `v1` existent, mais l’action **n’est pas listée** sur la Marketplace (`404` sur `github.com/marketplace/actions/visualq-action`). Des changements locaux (FRT, i18n, README) doivent être publiés avant la soumission.

## Prérequis GitHub (compte `abecms`)

1. [Accepter l’accord développeur Marketplace](https://github.com/marketplace/new) (organisation `abecms` → Settings → Developer settings → GitHub Apps / Marketplace).
2. Vérifier que le repo est **public** et que tu as les droits **admin** sur `abecms/visualq-action`.

## Checklist repo (avant release)

| Item | Fichier / action |
|------|------------------|
| `action.yml` à la racine avec `name`, `description`, `branding` | `action.yml` |
| README : usage, inputs, outputs, exemples | `README.md` |
| Licence MIT | `LICENSE` |
| Bundle compilé à jour | `npm run build` → `dist/index.js` |
| Pas de secrets committés | `.env`, clés API |
| Tag semver + tag majeur flottant | `v1.1.0` puis `v1` → `v1.1.0` |

## Métadonnées repo GitHub (Settings → General)

| Champ | Valeur suggérée |
|-------|-----------------|
| **Description** | Official GitHub Action for VisualQ — visual regression, perf budgets, SEO, a11y, FRT, and 6-pillar quality gates in CI. |
| **Website** | `https://visualq.ai/docs/ci-cd/github-action` |
| **Topics** | `github-actions`, `visual-regression`, `visual-testing`, `playwright`, `ci-cd`, `quality-gate`, `accessibility`, `lighthouse` |
| **License** | MIT (via fichier `LICENSE` à la racine) |

## Publier sur la Marketplace

### 1. Build et vérification locale

```bash
cd github-action
npm ci
npm run type-check
npm run build
git status   # dist/index.js doit être à jour
```

### 2. Commit, push, release

```bash
git add -A
git commit -m "chore: prepare v1.1.0 for GitHub Marketplace"
git push origin main

git tag v1.1.0
git push origin v1.1.0

# Tag majeur flottant (les workflows @v1 reçoivent la dernière 1.x)
git tag -fa v1 v1.1.0
git push origin v1 --force
```

### 3. Créer la release sur GitHub

1. Ouvrir [Releases → Draft a new release](https://github.com/abecms/visualq-action/releases/new).
2. Choisir le tag `v1.1.0`.
3. Titre : `v1.1.0`.
4. Corps (exemple) :

   ```markdown
   ## VisualQ GitHub Action v1.1.0

   - 6-pillar quality gates: VRT, perf, SEO, a11y, security, tracking, FRT
   - Localized action logs (16 locales)
   - `feature-ids` input for FRT batch runs
   - `environment`, `browsers`, `jira-key`, `perf-budgets` inputs

   ```yaml
   - uses: abecms/visualq-action@v1
     with:
       api-key: ${{ secrets.VISUALQ_API_KEY }}
       project: your-project-slug
   ```
   ```

5. **Cocher « Publish this Action to the GitHub Marketplace »**.
6. Choisir la catégorie : **Continuous integration** (ou **Testing**).
7. Publier la release.

Si la case Marketplace n’apparaît pas : vérifier `branding` + `description` dans `action.yml`, et que le fichier s’appelle bien `action.yml` (pas `.yaml`).

### 4. Vérification post-publication

- [ ] Listing live : [marketplace/actions/visualq-action](https://github.com/marketplace/actions/visualq-action)
- [ ] Badge README : remplacer le placeholder par le badge Marketplace
- [ ] Docs : `docs/content/docs/*/ci-cd/github-action.mdx` — lien Marketplace déjà dans `docs/src/app/[lang]/docs/layout.tsx`
- [ ] `tasks/acquisition-plan.md` — cocher l’audit listing S3
- [ ] `visualq/tasks/todo.md` — confirmer publication réelle (pas seulement la release)

## Notes Marketplace

- **Nom d’action** : défini par `name:` dans `action.yml` (`VisualQ`). Doit être unique sur la Marketplace.
- **Référence utilisateur** : `uses: abecms/visualq-action@v1` (tag majeur flottant).
- **Breaking changes** : bump `v2` + nouveau tag `v2` ; ne pas force-push `v1` avec du breaking.
- **Review** : les Actions Marketplace ne passent pas toujours par une review manuelle longue ; la validation est surtout sur le metadata YAML au moment de la release.

## Ressources

- [Publishing actions in GitHub Marketplace](https://docs.github.com/en/actions/sharing-automations/creating-actions/publishing-actions-in-github-marketplace)
- [Metadata syntax (branding)](https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax#branding)
- Doc produit : [visualq.ai/docs/ci-cd/github-action](https://visualq.ai/docs/ci-cd/github-action)
- Workflow agent PR : [docs/agent-pr-workflow.md](./agent-pr-workflow.md)
