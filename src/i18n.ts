/**
 * Tiny i18n catalog for the VisualQ GitHub Action.
 *
 * Mirrors `cli/src/i18n.ts` (and stays intentionally simple) so the bundled
 * Action stays small and dependency-free. Locale resolution priority:
 *   1. `locale` action input
 *   2. `VISUALQ_LOCALE` env var
 *   3. POSIX `LANG` (`fr_FR.UTF-8` -> `fr`)
 *   4. fallback to `en`
 */

export const ACTION_LOCALES = [
  'en',
  'zh-CN',
  'es',
  'ja',
  'de',
  'fr',
  'ru',
  'pt-BR',
  'ko',
  'it',
  'pl',
  'nl',
  'tr',
  'uk',
  'ar',
  'vi',
] as const

export type ActionLocale = (typeof ACTION_LOCALES)[number]

const DEFAULT_LOCALE: ActionLocale = 'en'

type Catalog = Record<string, string>

const en: Catalog = {
  'action.log.triggering': 'Triggering VisualQ {type} run...',
  'action.log.runStarted': 'Run started: {runId}',
  'action.log.runStartedWithEnv': 'Run started: {runId} (environment: {environment})',
  'action.log.notWaiting': 'Not waiting for completion (wait=false)',
  'action.log.stillRunning': 'Still running...',
  'action.log.budgetPassed': 'Performance budget passed (score: {score})',
  'action.log.perfCompleted': 'Performance audit completed — score: {score}/100',
  'action.log.noBudgets': 'No perf budgets set — passing by default',
  'action.log.seoCompleted': 'SEO audit completed — score: {score}/100, {passed} passed, {failed} failed',
  'action.log.seoPassed': 'All SEO checks passed!',
  'action.log.frtPassed': 'All FRT scenarios passed!',
  'action.error.frtFailed': '{count, plural, one {FRT batch: # scenario failed} other {FRT batch: # scenarios failed}}',
  'action.log.results': 'Results: {total} total, {passed} passed, {failed} failed',
  'action.log.allPassed': 'All scenarios passed!',
  'action.warn.invalidPerfBudgets': 'Invalid perf-budgets JSON — ignoring',
  'action.warn.invalidA11yBudgets': 'Invalid a11y-budgets JSON — ignoring',
  'action.log.a11yCompleted': 'Accessibility audit completed — score: {score}/100, {critical} critical, {violations} violations',
  'action.log.a11yPassed': 'All accessibility checks passed!',
  'action.log.a11yBudgetPassed': 'Accessibility budget passed (score: {score})',
  'action.error.a11yBudgetExceeded': 'Accessibility budget exceeded: {violations}',
  'action.error.a11yCriticalFailed': '{count, plural, one {Accessibility audit: # critical violation} other {Accessibility audit: # critical violations}}',
  'action.warn.statusRetry': 'Status check returned {status}, retrying...',
  'action.error.triggerFailed': 'Failed to trigger run: {status} {body}',
  'action.error.runFailed': 'Run failed: {message}',
  'action.error.budgetExceeded': 'Performance budget exceeded: {violations}',
  'action.error.seoFailed': '{count, plural, one {SEO audit: # check failed} other {SEO audit: # checks failed}}',
  'action.error.diffsDetected': '{count, plural, one {# visual difference detected} other {# visual differences detected}}',
  'action.error.timeout': 'Run timed out after {seconds}s',
  'action.error.actionFailed': 'Action failed: {message}',
}

const fr: Catalog = {
  'action.log.triggering': 'Déclenchement de l\u2019exécution VisualQ {type}…',
  'action.log.runStarted': 'Exécution démarrée : {runId}',
  'action.log.runStartedWithEnv': 'Exécution démarrée : {runId} (environnement : {environment})',
  'action.log.notWaiting': 'Pas d\u2019attente de la fin (wait=false)',
  'action.log.stillRunning': 'Toujours en cours…',
  'action.log.budgetPassed': 'Budget de performance respecté (score : {score})',
  'action.log.perfCompleted': 'Audit de performance terminé — score : {score}/100',
  'action.log.noBudgets': 'Aucun budget perf défini — succès par défaut',
  'action.log.seoCompleted': 'Audit SEO terminé — score : {score}/100, {passed} réussis, {failed} échoués',
  'action.log.seoPassed': 'Tous les checks SEO ont réussi !',
  'action.log.frtPassed': 'Tous les scénarios FRT ont réussi !',
  'action.error.frtFailed': '{count, plural, one {Batch FRT : # scénario échoué} other {Batch FRT : # scénarios échoués}}',
  'action.log.results': 'Résultats : {total} au total, {passed} réussis, {failed} échoués',
  'action.log.allPassed': 'Tous les scénarios ont réussi !',
  'action.warn.invalidPerfBudgets': 'JSON perf-budgets invalide — ignoré',
  'action.warn.invalidA11yBudgets': 'JSON a11y-budgets invalide — ignoré',
  'action.log.a11yCompleted': 'Audit accessibilité terminé — score : {score}/100, {critical} critiques, {violations} violations',
  'action.log.a11yPassed': 'Tous les checks accessibilité ont réussi !',
  'action.log.a11yBudgetPassed': 'Budget accessibilité respecté (score : {score})',
  'action.error.a11yBudgetExceeded': 'Budget accessibilité dépassé : {violations}',
  'action.error.a11yCriticalFailed': '{count, plural, one {Audit a11y : # violation critique} other {Audit a11y : # violations critiques}}',
  'action.warn.statusRetry': 'Le check de statut a renvoyé {status}, nouvelle tentative…',
  'action.error.triggerFailed': 'Échec du déclenchement : {status} {body}',
  'action.error.runFailed': 'Exécution échouée : {message}',
  'action.error.budgetExceeded': 'Budget de performance dépassé : {violations}',
  'action.error.seoFailed': '{count, plural, one {Audit SEO : # check échoué} other {Audit SEO : # checks échoués}}',
  'action.error.diffsDetected': '{count, plural, one {# différence visuelle détectée} other {# différences visuelles détectées}}',
  'action.error.timeout': 'Exécution expirée après {seconds}s',
  'action.error.actionFailed': 'Action échouée : {message}',
}

const CATALOGS: Partial<Record<ActionLocale, Catalog>> = { en, fr }

let activeLocale: ActionLocale = DEFAULT_LOCALE

export function setActionLocale(locale: string | undefined): void {
  if (!locale) return
  const normalized = normalizeLocaleTag(locale)
  if (normalized && (ACTION_LOCALES as readonly string[]).includes(normalized)) {
    activeLocale = normalized as ActionLocale
  }
}

export function detectActionLocale(env: NodeJS.ProcessEnv = process.env): ActionLocale {
  const candidates = [env.VISUALQ_LOCALE, env.LC_ALL, env.LC_MESSAGES, env.LANG]
  for (const candidate of candidates) {
    if (!candidate) continue
    const normalized = normalizeLocaleTag(candidate)
    if (normalized && (ACTION_LOCALES as readonly string[]).includes(normalized)) {
      return normalized as ActionLocale
    }
  }
  return DEFAULT_LOCALE
}

function normalizeLocaleTag(raw: string): string | undefined {
  const cleaned = raw.split(/[.@]/)[0]?.replace('_', '-')
  if (!cleaned) return undefined
  if ((ACTION_LOCALES as readonly string[]).includes(cleaned)) return cleaned
  const lower = cleaned.toLowerCase()
  if (lower === 'pt-br') return 'pt-BR'
  if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh') return 'zh-CN'
  return cleaned.split('-')[0]
}

export function t(key: string, params: Record<string, string | number> = {}): string {
  const catalog = CATALOGS[activeLocale] ?? en
  const template = catalog[key] ?? en[key] ?? key
  return formatMessage(template, params)
}

function formatMessage(template: string, params: Record<string, string | number>): string {
  let out = applyPlurals(template, params)
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }
  return out
}

function applyPlurals(template: string, params: Record<string, string | number>): string {
  const re = /\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g
  return template.replace(re, (_, name: string, oneBranch: string, otherBranch: string) => {
    const value = Number(params[name])
    const branch = value === 1 ? oneBranch : otherBranch
    return branch.replace(/#/g, String(params[name] ?? ''))
  })
}
