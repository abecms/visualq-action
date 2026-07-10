# VisualQ — GitHub Action

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-VisualQ%20Quality%20Gates-purple?logo=github)](https://github.com/marketplace/actions/visualq-quality-gates)

Run **VisualQ Quality Score gates** on every pull request — VRT, FRT, and six quality pillars in one CI step with [VisualQ](https://visualq.ai/login?utm_source=github&utm_medium=web&utm_campaign=acquisition). Catch visual bugs, accessibility regressions, perf budget failures, and functional test regressions before production.

**Free Quality Audit** (no signup, real Lighthouse + axe): [visualq.ai/audit](https://visualq.ai/audit?utm_source=github&utm_medium=web&utm_campaign=acquisition)

**Also available:** [`@visualq/cli`](https://www.npmjs.com/package/@visualq/cli) for GitLab/Jenkins · [`@visualq/mcp`](https://www.npmjs.com/package/@visualq/mcp) for Cursor/Claude Desktop

**Full documentation:** [visualq.ai/docs/ci-cd/github-action](https://visualq.ai/docs/ci-cd/github-action)

## Quick start

```yaml
# .github/workflows/visualq-quality-gate.yml
name: VisualQ Quality Gate
on: [pull_request]

jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: abecms/visualq-action@v1
        with:
          api-key: ${{ secrets.VISUALQ_API_KEY }}
          project: "your-project-slug"
```

### Get your API key

1. Sign up at [visualq.ai](https://visualq.ai/login?utm_source=github&utm_medium=web&utm_campaign=acquisition)
2. Open **Settings → API keys** in your project
3. Add the key as a repository secret: `VISUALQ_API_KEY`

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | Yes | — | Your VisualQ API key ([repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)) |
| `project` | Yes | — | VisualQ project slug |
| `type` | No | `test` | Run type: `test`, `baseline`, `perf`, `seo`, `a11y`, `security`, `tracking`, or `frt` |
| `feature-ids` | No | — | Comma-separated FRT feature IDs (only when `type: frt`) |
| `environment` | No | — | Environment name or slug (e.g. `staging`, `production`) |
| `scenarios` | No | — | Comma-separated scenario labels to test |
| `browsers` | No | — | Comma-separated: `chromium`, `firefox`, `webkit` |
| `wait` | No | `true` | Wait for run completion (`true` or `false`) |
| `api-url` | No | `https://visualq.ai` | VisualQ API base URL |
| `jira-key` | No | — | Jira issue key to link results (e.g. `PROJ-123`) |
| `perf-budgets` | No | — | JSON perf budgets, e.g. `{"lcp":2500,"fcp":1800,"cls":0.1,"tbt":300,"ttfb":800,"score":75}` |
| `locale` | No | auto | Log language: `en`, `fr`, `es`, `de`, `it`, `pt`, `pt-BR`, `nl`, `pl`, `tr`, `ru`, `zh`, `ja`, `ko`, `ar`, `hi`. Auto-detected from `LANG` or `VISUALQ_LOCALE` when omitted |

## Outputs

| Output | Description |
|--------|-------------|
| `run-id` | The VRT run ID |
| `status` | Run status: `completed`, `failed`, or `started` (when `wait: false`) |
| `passed` | Number of passed scenarios |
| `failed` | Number of failed scenarios |
| `frt-failed-steps` | Number of failed FRT steps (when `type: frt`) |
| `report-url` | URL to the report on VisualQ (includes `?environmentId=` when an environment was resolved) |
| `perf-score` | Performance score 0–100 (when `type: perf`) |
| `seo-score` | SEO score 0–100 (when `type: seo`) |

## Example workflows

### Visual tests on pull requests

```yaml
name: Visual Tests
on: pull_request

jobs:
  vrt:
    runs-on: ubuntu-latest
    steps:
      - uses: abecms/visualq-action@v1
        id: vrt
        with:
          api-key: ${{ secrets.VISUALQ_API_KEY }}
          project: my-website

      - name: Comment results
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `Visual test: **${{ steps.vrt.outputs.status }}** — ${{ steps.vrt.outputs.passed }} passed, ${{ steps.vrt.outputs.failed }} failed. [View report](${{ steps.vrt.outputs.report-url }})`
            })
```

### Update baselines on main

```yaml
name: Update Baselines
on:
  push:
    branches: [main]

jobs:
  baseline:
    runs-on: ubuntu-latest
    steps:
      - uses: abecms/visualq-action@v1
        with:
          api-key: ${{ secrets.VISUALQ_API_KEY }}
          project: my-website
          type: baseline
```

### Performance budgets

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: my-website
    type: perf
    environment: staging
    perf-budgets: '{"lcp":2500,"cls":0.1,"score":75}'
```

### FRT functional tests

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: my-website
    type: frt
    environment: staging
    # feature-ids: feat_abc,feat_def
```

### Test against staging

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: my-website
    environment: staging
```

### Multi-browser testing

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: my-website
    browsers: "chromium,firefox,webkit"
```

### Fire and forget

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: my-website
    wait: "false"
```

## How it works

1. The action triggers a run via the VisualQ CI API (`POST /api/ci/run`)
2. VisualQ executes the requested audit type (VRT, perf, SEO, FRT, etc.)
3. The action polls for completion (up to 5 minutes) and reports results
4. On failure, the check fails with a link to the diff/report on VisualQ

PR context (`commitSha`, `branch`, `prNumber`) is sent automatically when the workflow runs on a pull request.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `unauthorized` | Verify `VISUALQ_API_KEY` secret and project slug |
| Timeout after 5 min | Test fewer scenarios (`scenarios` input) or split into parallel jobs |
| Marketplace badge 404 | Listing not published yet — see [docs/MARKETPLACE.md](./docs/MARKETPLACE.md) |

## License

MIT — see [LICENSE](./LICENSE).
