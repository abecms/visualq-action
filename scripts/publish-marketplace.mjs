import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const url = 'https://github.com/abecms/visualq-action/releases/edit/v1.1.0'
const statePath = path.join(process.cwd(), '.github-marketplace-auth.json')

async function publish() {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' })
  const context = await browser.newContext(
    fs.existsSync(statePath) ? { storageState: statePath } : {},
  )
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 })

  if ((await page.title()).toLowerCase().includes('sign in')) {
    console.log('Sign in to GitHub in the browser window (up to 5 min)...')
    await page.waitForURL(/releases\/edit\/v1\.1\.0/, { timeout: 300_000 })
    await context.storageState({ path: statePath })
  }

  const marketplace = page.getByLabel(/Publish this Action to the GitHub Marketplace/i)
  await marketplace.waitFor({ state: 'visible', timeout: 60_000 })

  if (!(await marketplace.isChecked())) {
    await marketplace.check()
    console.log('Checked Marketplace publish box')
  } else {
    console.log('Marketplace box already checked')
  }

  const submit = page.getByRole('button', { name: /Update release/i })
  await submit.click()
  console.log('Clicked Update release — complete 2FA if prompted (up to 2 min)')

  await page.waitForTimeout(120_000)
  await context.storageState({ path: statePath })
  await browser.close()
  console.log('Browser closed')
}

publish().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
