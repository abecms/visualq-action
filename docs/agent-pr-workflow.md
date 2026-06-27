# Agent PR workflow — FRT + VRT quality gate

Run VisualQ functional and visual tests on every pull request, then let your agent call `gate_pr_quality` via MCP.

## GitHub Action — FRT batch

```yaml
- name: VisualQ FRT
  uses: abecms/visualq-action@v1
  with:
    api-key: ${{ secrets.VISUALQ_API_KEY }}
    project: my-site
    type: frt
    environment: staging
    # Optional: run subset only
    # feature-ids: feat_abc,feat_def
```

## GitHub Action — VRT + FRT (parallel jobs)

```yaml
jobs:
  vrt:
    runs-on: ubuntu-latest
    steps:
      - uses: abecms/visualq-action@v1
        with:
          api-key: ${{ secrets.VISUALQ_API_KEY }}
          project: my-site
          type: test
          environment: staging

  frt:
    runs-on: ubuntu-latest
    steps:
      - uses: abecms/visualq-action@v1
        with:
          api-key: ${{ secrets.VISUALQ_API_KEY }}
          project: my-site
          type: frt
          environment: staging
```

## CLI

```bash
visualq frt --api-key vq_live_… --project my-site --environment staging
visualq frt --feature-ids feat_a,feat_b --project my-site
```

## Agent gate (Cursor + @visualq/mcp)

After CI runs, ask your agent to use the **`pr-quality-gate`** prompt or call `gate_pr_quality` directly. The tool aggregates:

- Latest VRT failures
- Latest FRT batch status
- Rolling health blockers

Never treat a single run as the site score — use rolling health from `get_site_health`.
