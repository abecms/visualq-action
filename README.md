# VisualQ — GitHub Action

Run visual regression tests on every pull request with [VisualQ](https://visualq.ai). Catch pixel-level UI differences before they reach production.

## Quick start

```yaml
# .github/workflows/visual-test.yml
name: Visual Regression
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

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | Yes | — | Your VisualQ API key (use a [repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)) |
| `project` | Yes | — | VisualQ project slug |
| `type` | No | `test` | Run type: `test` (compare to baseline) or `baseline` (capture new baseline) |
| `scenarios` | No | — | Comma-separated scenario labels to test |
| `wait` | No | `true` | Wait for run completion (`true` or `false`) |
| `api-url` | No | `https://visualq.ai` | VisualQ API base URL |

## Outputs

| Output | Description |
|--------|-------------|
| `run-id` | The VRT run ID |
| `status` | Run status: `completed`, `failed`, or `started` |
| `passed` | Number of passed scenarios |
| `failed` | Number of failed scenarios |
| `report-url` | URL to the visual diff report |

## Advanced usage

### Run on push to main (update baselines)

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
          project: "your-project-slug"
          type: "baseline"
```

### Test specific scenarios

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: "your-project-slug"
    scenarios: "homepage, checkout, dashboard"
```

### Fire and forget (don't wait for results)

```yaml
- uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: "your-project-slug"
    wait: "false"
```

### Use outputs in subsequent steps

```yaml
- uses: abecms/visualq-action@v1
  id: vrt
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: "your-project-slug"

- run: echo "Report → ${{ steps.vrt.outputs.report-url }}"
```

## How it works

1. The action triggers a visual regression run via the VisualQ API
2. VisualQ captures screenshots of your scenarios and compares them to baselines
3. The action polls for completion and reports results
4. If visual differences are detected, the action fails the check with a link to the diff report

## License

MIT
