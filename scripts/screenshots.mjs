import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync } from 'node:fs'

mkdirSync('/workspace/docs/screenshots', { recursive: true })
mkdirSync('/opt/cursor/artifacts/screenshots', { recursive: true })

const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], {
  cwd: '/workspace',
  stdio: 'pipe',
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

try {
  await waitReady()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const shots = [
    ['/opps', 'opps'],
    ['/deals', 'deals'],
    ['/accounts', 'accounts'],
    ['/contacts', 'contacts'],
  ]

  for (const [path, name] of shots) {
    await page.goto('http://127.0.0.1:5173' + path, { waitUntil: 'networkidle' })
    await sleep(800)
    if (name === 'opps') {
      await page.locator('.cg-row a').first().click()
      await page.getByTestId('opp-panel').waitFor()
    }
    if (name === 'deals') {
      await page.getByText('Fake Solar Alpha').first().click()
      await page.getByTestId('deal-drawer').waitFor()
    }
    const dest1 = `/workspace/docs/screenshots/${name}.png`
    const dest2 = `/opt/cursor/artifacts/screenshots/${name}.png`
    await page.screenshot({ path: dest1, fullPage: false })
    await page.screenshot({ path: dest2, fullPage: false })
    console.log('saved', name)
  }

  await browser.close()
} finally {
  child.kill('SIGTERM')
}
