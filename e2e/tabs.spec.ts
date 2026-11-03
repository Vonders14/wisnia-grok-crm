import { test, expect } from '@playwright/test'

test.describe('Attio-style CRM (mock data)', () => {
  test('Opps grid loads and opens drawer', async ({ page }) => {
    await page.goto('/opps')
    await expect(page.getByText('Wisnia Capital').first()).toBeVisible()
    await expect(page.locator('.crumb')).toContainText('Opps')
    await expect(page.getByText('Read-only')).toBeVisible()
    await expect(page.getByTestId('data-grid')).toBeVisible()
    await page.locator('[data-testid="data-grid"] .rn a').first().click()
    await expect(page.getByTestId('opp-panel')).toBeVisible()
    await expect(page.getByText('Email thread')).toBeVisible()
  })

  test('Deals table and drawer', async ({ page }) => {
    await page.goto('/deals')
    await expect(page.locator('.crumb')).toContainText('Deals')
    await expect(page.getByText('Fake Solar Alpha').first()).toBeVisible()
    await page.getByText('Fake Solar Alpha').first().click()
    await expect(page.getByTestId('deal-drawer')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Data room' })).toBeVisible()
  })

  test('Deals kanban board', async ({ page }) => {
    await page.goto('/deals?layout=board')
    await expect(page.getByTestId('deals-kanban')).toBeVisible()
    await expect(page.getByText('Marketing').first()).toBeVisible()
    await expect(page.locator('.card').first()).toBeVisible()
  })

  test('Accounts prospect grid', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page.locator('.crumb')).toContainText('Accounts')
    await expect(page.getByText('Fake Investor').first()).toBeVisible()
    // click a non-link cell so the drawer opens without navigating
    await page.locator('[data-testid="data-grid"] .chip.dom').first().click()
    await expect(page.getByTestId('prospect-drawer')).toBeVisible()
  })

  test('Contacts prospect grid + bulk bar', async ({ page }) => {
    await page.goto('/contacts')
    await expect(page.locator('.crumb')).toContainText('Contacts')
    await expect(page.getByText('Pat Fake').first()).toBeVisible()
    await page.locator('[data-testid="data-grid"] .cb').nth(1).click()
    await expect(page.getByTestId('bulk-bar')).toBeVisible()
    await expect(page.getByText(/selected/)).toBeVisible()
  })

  test('Record page layout', async ({ page }) => {
    await page.goto('/people/cont-fake-001')
    await expect(page.getByTestId('record-page')).toBeVisible()
    await expect(page.getByText('Pat Fake1').first()).toBeVisible()
    await expect(page.getByText('Details')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Activity' })).toBeVisible()
  })

  test('Cmd-K palette', async ({ page }) => {
    await page.goto('/opps')
    await page.locator('.side button.ni', { hasText: 'Search' }).click()
    await expect(page.getByTestId('cmdk')).toBeVisible()
    await page.getByPlaceholder(/Search people/i).fill('Fake')
    await expect(page.getByTestId('cmdk').locator('.mi').first()).toBeVisible({ timeout: 5000 })
  })

  test('nav between tabs', async ({ page }) => {
    await page.goto('/opps')
    await page.locator('.side a.ni', { hasText: 'Deals' }).click()
    await expect(page).toHaveURL(/\/deals/)
    await page.locator('.side a.ni', { hasText: 'Accounts' }).click()
    await expect(page).toHaveURL(/\/accounts/)
    await page.locator('.side a.ni', { hasText: 'Contacts' }).click()
    await expect(page).toHaveURL(/\/contacts/)
  })
})
