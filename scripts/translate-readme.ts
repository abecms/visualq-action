#!/usr/bin/env node
/**
 * Translate README.md into README.{locale}.md for every supported CLI locale.
 *
 * The script preserves Markdown structure (code fences, tables, links) by
 * relying on a strict system prompt. It skips any locale whose translated
 * README already exists unless `--force` is passed.
 *
 * Usage:
 *   npm run readme:translate                  # all locales
 *   npm run readme:translate -- --locale fr   # single locale
 *   npm run readme:translate -- --force       # overwrite existing
 *   npm run readme:translate -- --dry         # show plan only
 *
 * Env: OPENROUTER_API_KEY
 */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const LOCALES = [
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

const LOCALE_NAMES: Record<string, string> = {
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  'pt-BR': 'Brazilian Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  ru: 'Russian',
  'zh-CN': 'Simplified Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
}

interface Args {
  locale?: string
  force: boolean
  dry: boolean
  model: string
  source: string
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false, dry: false, model: 'openai/gpt-4o-mini', source: 'README.md' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--locale') args.locale = argv[++i]
    else if (a === '--force') args.force = true
    else if (a === '--dry') args.dry = true
    else if (a === '--model') args.model = argv[++i] ?? args.model
    else if (a === '--source') args.source = argv[++i] ?? args.source
  }
  return args
}

const SYSTEM = `You are a professional technical translator for developer-tool README files.

Translate the provided Markdown README into the target language while preserving the source structure exactly.

ABSOLUTE RULES:
1. Output the translated Markdown ONLY — no preamble, no explanation, no surrounding code fence.
2. NEVER translate or modify text inside fenced code blocks (\`\`\`...\`\`\`) or inline backtick spans.
3. Preserve Markdown link/image syntax: keep URLs intact, only translate the visible link text.
4. Preserve table syntax (pipes, alignment) and translate only cell text.
5. Keep CLI flag names (e.g. --api-key), env var names (e.g. VISUALQ_API_KEY), brand names (VisualQ, GitHub, GitLab, CircleCI…), and slug-like identifiers UNCHANGED.
6. Use natural, idiomatic phrasing for the target language (not a literal word-for-word translation).
7. Match the source's heading levels, list structure, blockquotes, and line breaks.
8. Preserve YAML/JSON examples in code blocks verbatim.`

async function translate(source: string, locale: string, model: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://visualq.ai',
      'X-Title': 'VisualQ README Translator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Translate this README into ${LOCALE_NAMES[locale]} (${locale}). Output the full translated Markdown.\n\n${source}`,
        },
      ],
      temperature: 0.1,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 500)}`)
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const out = data.choices?.[0]?.message?.content
  if (!out) throw new Error('Empty completion')
  return out.trim() + '\n'
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const root = process.cwd()
  const sourcePath = path.resolve(root, args.source)
  if (!existsSync(sourcePath)) throw new Error(`Source README not found: ${sourcePath}`)

  const source = await readFile(sourcePath, 'utf-8')
  const targets = args.locale ? [args.locale] : LOCALES

  console.log(`Translating ${path.basename(sourcePath)} into: ${targets.join(', ')}`)

  for (const locale of targets) {
    if (!LOCALE_NAMES[locale]) {
      console.warn(`Unknown locale: ${locale} — skipping`)
      continue
    }
    const targetPath = path.resolve(root, `README.${locale}.md`)
    if (!args.force && existsSync(targetPath)) {
      console.log(`= ${path.basename(targetPath)} (exists, skipping)`)
      continue
    }
    if (args.dry) {
      console.log(`would translate -> ${path.basename(targetPath)}`)
      continue
    }
    try {
      const out = await translate(source, locale, args.model)
      await writeFile(targetPath, out)
      console.log(`✓ ${path.basename(targetPath)}`)
    } catch (err) {
      console.error(`✗ ${path.basename(targetPath)}: ${(err as Error).message}`)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
