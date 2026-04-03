import * as core from '@actions/core'
import * as github from '@actions/github'

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_DURATION_MS = 300_000

interface CIRunResponse {
  success: boolean
  runId: string
  projectId: string
  type: string
  statusUrl: string
  message: string
}

interface CIStatusResponse {
  runId: string
  projectId: string
  status: string
  type: string
  duration?: number
  summary?: {
    total: number
    passed: number
    failed: number
  }
  error?: string
}

async function run() {
  try {
    const apiKey = core.getInput('api-key', { required: true })
    const project = core.getInput('project', { required: true })
    const type = core.getInput('type') || 'test'
    const scenarios = core.getInput('scenarios')
    const wait = core.getInput('wait') !== 'false'
    const apiUrl = core.getInput('api-url') || 'https://visualq.ai'

    const context = github.context

    const body: Record<string, unknown> = {
      project,
      type,
      commitSha: context.sha,
      branch: context.ref.replace('refs/heads/', ''),
      ciProvider: 'github-actions',
    }

    if (context.payload.pull_request) {
      body.prNumber = context.payload.pull_request.number
      body.prUrl = context.payload.pull_request.html_url
    }

    if (scenarios) {
      body.scenarios = scenarios.split(',').map(s => s.trim()).filter(Boolean)
    }

    core.info(`Triggering VisualQ ${type} run...`)

    const triggerRes = await fetch(`${apiUrl}/api/ci/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!triggerRes.ok) {
      const errText = await triggerRes.text()
      core.setFailed(`Failed to trigger run: ${triggerRes.status} ${errText}`)
      return
    }

    const triggerData = (await triggerRes.json()) as CIRunResponse
    const { runId } = triggerData

    core.setOutput('run-id', runId)
    core.info(`Run started: ${runId}`)

    if (!wait) {
      core.info('Not waiting for completion (wait=false)')
      core.setOutput('status', 'started')
      return
    }

    const startTime = Date.now()

    while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
      await sleep(POLL_INTERVAL_MS)

      const statusRes = await fetch(`${apiUrl}/api/ci/status/${runId}`, {
        headers: { 'X-API-Key': apiKey },
      })

      if (!statusRes.ok) {
        core.warning(`Status check returned ${statusRes.status}, retrying...`)
        continue
      }

      const statusData = (await statusRes.json()) as CIStatusResponse

      if (statusData.status === 'running') {
        core.info('Still running...')
        continue
      }

      core.setOutput('status', statusData.status)
      const reportUrl = `${apiUrl}/projects/${project}/tests`
      core.setOutput('report-url', reportUrl)

      if (statusData.status === 'failed') {
        core.setFailed(`Run failed: ${statusData.error || 'Unknown error'}`)
        return
      }

      if (statusData.summary) {
        core.setOutput('passed', statusData.summary.passed.toString())
        core.setOutput('failed', statusData.summary.failed.toString())

        core.info(`Results: ${statusData.summary.total} total, ${statusData.summary.passed} passed, ${statusData.summary.failed} failed`)

        if (statusData.summary.failed > 0) {
          core.setFailed(`${statusData.summary.failed} visual difference(s) detected`)
          return
        }
      }

      core.info('All scenarios passed!')
      return
    }

    core.setFailed(`Run timed out after ${MAX_POLL_DURATION_MS / 1000}s`)
  } catch (error) {
    core.setFailed(`Action failed: ${(error as Error).message}`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

run()
