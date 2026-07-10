import * as core from '@actions/core'
import * as github from '@actions/github'
import { setActionLocale, detectActionLocale, t } from './i18n.js'

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_DURATION_MS = 300_000

interface CIRunResponse {
  success: boolean
  runId: string
  projectId: string
  type: string
  environmentId?: string
  environmentName?: string
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
  perfScore?: number
  perfAvgLcp?: number
  perfAvgCls?: number
  perfBudgetResult?: {
    pass: boolean
    violations: string[]
  }
  seoScore?: number
  seoPassed?: number
  seoFailed?: number
  a11yScore?: number
  a11yCriticalCount?: number
  a11yTotalViolations?: number
  a11yBudgetResult?: {
    pass: boolean
    violations: string[]
    newViolationCount?: number
  }
  frt?: {
    failedSteps?: number
    featureCount?: number | null
  }
}

async function run() {
  try {
    const apiKey = core.getInput('api-key', { required: true })
    const project = core.getInput('project', { required: true })
    const type = core.getInput('type') || 'test'
    const scenarios = core.getInput('scenarios')
    const wait = core.getInput('wait') !== 'false'
    const apiUrl = core.getInput('api-url') || 'https://visualq.ai'
    const jiraKey = core.getInput('jira-key')
    const browsers = core.getInput('browsers')
    const environment = core.getInput('environment')
    const perfBudgetsInput = core.getInput('perf-budgets')
    const a11yBudgetsInput = core.getInput('a11y-budgets')
    const featureIdsInput = core.getInput('feature-ids')
    const localeInput = core.getInput('locale')

    setActionLocale(localeInput || detectActionLocale())

    const context = github.context

    const body: Record<string, unknown> = {
      project,
      type,
      commitSha: context.sha,
      branch: context.ref.replace('refs/heads/', ''),
      ciProvider: 'github-actions',
    }

    if (environment) {
      body.environment = environment
    }
    if (jiraKey) {
      body.jiraKey = jiraKey
    }

    if (context.payload.pull_request) {
      body.prNumber = context.payload.pull_request.number
      body.prUrl = context.payload.pull_request.html_url
    }

    if (scenarios) {
      body.scenarios = scenarios.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (browsers) {
      body.browsers = browsers.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (featureIdsInput && type === 'frt') {
      body.featureIds = featureIdsInput.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (perfBudgetsInput) {
      try {
        body.perfBudgets = JSON.parse(perfBudgetsInput)
      } catch {
        core.warning(t('action.warn.invalidPerfBudgets'))
      }
    }
    if (a11yBudgetsInput) {
      try {
        body.a11yBudgets = JSON.parse(a11yBudgetsInput)
      } catch {
        core.warning(t('action.warn.invalidA11yBudgets'))
      }
    }

    core.info(t('action.log.triggering', { type }))

    const triggerRes = await fetch(`${apiUrl}/api/ci/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Accept-Language': localeInput || process.env.VISUALQ_LOCALE || process.env.LANG || 'en',
      },
      body: JSON.stringify(body),
    })

    if (!triggerRes.ok) {
      const errText = await triggerRes.text()
      core.setFailed(t('action.error.triggerFailed', { status: triggerRes.status, body: errText }))
      return
    }

    const triggerData = (await triggerRes.json()) as CIRunResponse
    const { runId } = triggerData

    core.setOutput('run-id', runId)
    if (triggerData.environmentName) {
      core.info(t('action.log.runStartedWithEnv', { runId, environment: triggerData.environmentName }))
    } else {
      core.info(t('action.log.runStarted', { runId }))
    }

    if (!wait) {
      core.info(t('action.log.notWaiting'))
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
        core.warning(t('action.warn.statusRetry', { status: statusRes.status }))
        continue
      }

      const statusData = (await statusRes.json()) as CIStatusResponse

      if (statusData.status === 'running') {
        core.info(t('action.log.stillRunning'))
        continue
      }

      core.setOutput('status', statusData.status)
      let reportUrl = `${apiUrl}/projects/${project}/${type === 'frt' ? 'frt/history' : 'tests'}`
      const resolvedEnvId = triggerData.environmentId
      if (resolvedEnvId) reportUrl += `?environmentId=${encodeURIComponent(resolvedEnvId)}`
      core.setOutput('report-url', reportUrl)

      if (statusData.status === 'failed') {
        core.setFailed(t('action.error.runFailed', { message: statusData.error || 'Unknown error' }))
        return
      }

      if (statusData.perfBudgetResult) {
        core.setOutput('perf-score', (statusData.perfScore ?? 0).toString())
        if (!statusData.perfBudgetResult.pass) {
          const violations = statusData.perfBudgetResult.violations.join(', ')
          core.setFailed(t('action.error.budgetExceeded', { violations }))
          return
        }
        core.info(t('action.log.budgetPassed', { score: statusData.perfScore ?? 0 }))
      }

      if (statusData.a11yBudgetResult) {
        if (statusData.a11yScore != null) {
          core.setOutput('a11y-score', statusData.a11yScore.toString())
        }
        if (statusData.a11yCriticalCount != null) {
          core.setOutput('a11y-critical-count', statusData.a11yCriticalCount.toString())
        }
        if (!statusData.a11yBudgetResult.pass) {
          const violations = statusData.a11yBudgetResult.violations.join(', ')
          core.setFailed(t('action.error.a11yBudgetExceeded', { violations }))
          return
        }
        core.info(t('action.log.a11yBudgetPassed', { score: statusData.a11yScore ?? 0 }))
      }

      if (statusData.type === 'perf-test' && statusData.perfScore != null) {
        core.setOutput('perf-score', statusData.perfScore.toString())
        core.info(t('action.log.perfCompleted', { score: statusData.perfScore }))
        if (!statusData.perfBudgetResult) {
          core.info(t('action.log.noBudgets'))
        }
        return
      }

      if (statusData.type === 'frt-test') {
        if (statusData.summary) {
          core.setOutput('passed', statusData.summary.passed.toString())
          core.setOutput('failed', statusData.summary.failed.toString())
          core.info(t('action.log.results', {
            total: statusData.summary.total,
            passed: statusData.summary.passed,
            failed: statusData.summary.failed,
          }))
          if (statusData.frt?.failedSteps != null) {
            core.setOutput('frt-failed-steps', statusData.frt.failedSteps.toString())
          }
          if (statusData.summary.failed > 0) {
            core.setFailed(t('action.error.frtFailed', { count: statusData.summary.failed }))
            return
          }
        }
        core.info(t('action.log.frtPassed'))
        return
      }

      if (statusData.type === 'seo-test' && statusData.seoScore != null) {
        core.setOutput('seo-score', statusData.seoScore.toString())
        core.info(t('action.log.seoCompleted', {
          score: statusData.seoScore,
          passed: statusData.seoPassed ?? 0,
          failed: statusData.seoFailed ?? 0,
        }))
        if ((statusData.seoFailed ?? 0) > 0) {
          core.setFailed(t('action.error.seoFailed', { count: statusData.seoFailed ?? 0 }))
          return
        }
        core.info(t('action.log.seoPassed'))
        return
      }

      if (statusData.type === 'a11y-test') {
        if (statusData.a11yScore != null) {
          core.setOutput('a11y-score', statusData.a11yScore.toString())
        }
        if (statusData.a11yCriticalCount != null) {
          core.setOutput('a11y-critical-count', statusData.a11yCriticalCount.toString())
        }
        core.info(t('action.log.a11yCompleted', {
          score: statusData.a11yScore ?? 0,
          critical: statusData.a11yCriticalCount ?? 0,
          violations: statusData.a11yTotalViolations ?? 0,
        }))
        if (statusData.a11yBudgetResult && !statusData.a11yBudgetResult.pass) {
          const violations = statusData.a11yBudgetResult.violations.join(', ')
          core.setFailed(t('action.error.a11yBudgetExceeded', { violations }))
          return
        }
        if ((statusData.a11yCriticalCount ?? 0) > 0 && !statusData.a11yBudgetResult) {
          core.setFailed(t('action.error.a11yCriticalFailed', { count: statusData.a11yCriticalCount ?? 0 }))
          return
        }
        core.info(t('action.log.a11yPassed'))
        return
      }

      if (statusData.summary) {
        core.setOutput('passed', statusData.summary.passed.toString())
        core.setOutput('failed', statusData.summary.failed.toString())

        core.info(t('action.log.results', {
          total: statusData.summary.total,
          passed: statusData.summary.passed,
          failed: statusData.summary.failed,
        }))

        if (statusData.summary.failed > 0) {
          core.setFailed(t('action.error.diffsDetected', { count: statusData.summary.failed }))
          return
        }
      }

      core.info(t('action.log.allPassed'))
      return
    }

    core.setFailed(t('action.error.timeout', { seconds: MAX_POLL_DURATION_MS / 1000 }))
  } catch (error) {
    core.setFailed(t('action.error.actionFailed', { message: (error as Error).message }))
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

run()
