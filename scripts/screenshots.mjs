import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync } from 'node:fs'

mkdirSync('/workspace/docs/screenshots', { recursive: true })
mkdirSync('/opt/cursor/artifacts/screenshots', { recursive: true })

const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], {
  cwd: '/workspace',
  stdio: 'ignore',
  detached: true,
  env: { ...process.env },
})

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://127.0.0.1:5173')
      if (r.ok) return
    } catch {
      /* retry */
    }
    await sleep(500)
  }
  throw new Error('dev server not ready')
}

async function shot(page, name) {
  const dest1 = `/workspace/docs/screenshots/${name}.png`
  const dest2 = `/opt/cursor/artifacts/screenshots/${name}.png`
  await page.screenshot({ path: dest1, fullPage: false })
  await page.screenshot({ path: dest2, fullPage: false })
  console.log('saved', name)
}

try {
  await waitReady()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto('http://127.0.0.1:5173/opps', { waitUntil: 'networkidle' })
  await sleep(600)
  await page.locator('[data-testid="data-grid"] .rn a').first().click()
  await page.getByTestId('opp-panel').waitFor()
  await shot(page, 'opps')

  await page.goto('http://127.0.0.1:5173/deals', { waitUntil: 'networkidle' })
  await sleep(500)
  await page.getByText('Fake Solar Alpha').first().click()
  await page.getByTestId('deal-drawer').waitFor()
  await shot(page, 'deals')

  await page.goto('http://127.0.0.1:5173/deals?layout=board', { waitUntil: 'networkidle' })
  await sleep(500)
  await page.getByTestId('deals-kanban').waitFor()
  await shot(page, 'deals-kanban')

  await page.goto('http://127.0.0.1:5173/accounts', { waitUntil: 'networkidle' })
  await sleep(500)
  await shot(page, 'accounts')

  await page.goto('http://127.0.0.1:5173/contacts', { waitUntil: 'networkidle' })
  await sleep(400)
  await page.locator('[data-testid="data-grid"] .cb').nth(1).click()
  await page.locator('[data-testid="data-grid"] .cb').nth(2).click()
  await page.getByTestId('bulk-bar').waitFor()
  await shot(page, 'contacts')

  await page.goto('http://127.0.0.1:5173/people/cont-fake-003', { waitUntil: 'networkidle' })
  await sleep(500)
  await shot(page, 'record-page')

  await page.goto('http://127.0.0.1:5173/opps', { waitUntil: 'networkidle' })
  await page.locator('.side button.ni', { hasText: 'Search' }).click()
  await page.getByTestId('cmdk').waitFor()
  await page.getByPlaceholder(/Search people/i).fill('Fake')
  await sleep(700)
  await shot(page, 'cmdk')

  await browser.close()
} finally {
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      /* ignore */
    }
  }
}
