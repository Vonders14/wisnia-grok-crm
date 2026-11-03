import { test, expect } from '@playwright/test'

test.describe('four CRM tabs (mock data)', () => {
  test('Opps grid loads and opens panel', async ({ page }) => {
    await page.goto('/opps')
    await expect(page.getByRole('heading', { name: 'Opps' })).toBeVisible()
    await expect(page.getByText(/live/i)).toBeVisible()
    await expect(page.getByText('Read-only preview')).toBeVisible()
    // click first topic link cell area — open first row via navigating after click
    const firstLink = page.locator('.cg-row a').first()
    await expect(firstLink).toBeVisible()
    await firstLink.click()
    await expect(page.getByTestId('opp-panel')).toBeVisible()
    await expect(page.getByText('Email thread')).toBeVisible()
    await expect(page.getByText('Coming soon').first()).toBeVisible()
  })

  test('Deals grid and drawer', async ({ page }) => {
    await page.goto('/deals')
    await expect(page.getByRole('heading', { name: 'Deals' })).toBeVisible()
    await expect(page.getByText('Fake Solar Alpha').first()).toBeVisible()
    await page.getByText('Fake Solar Alpha').first().click()
    await expect(page.getByTestId('deal-drawer')).toBeVisible()
    await expect(page.getByText('Data room (read)')).toBeVisible()
  })

  test('Accounts prospect grid', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
    await expect(page.getByText('Fake Investor').first()).toBeVisible()
    await page.locator('.cg-row').first().click()
    await expect(page.getByTestId('prospect-drawer')).toBeVisible()
  })

  test('Contacts prospect grid', async ({ page }) => {
    await page.goto('/contacts')
    await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible()
    await expect(page.getByText('Pat Fake').first()).toBeVisible()
  })

  test('nav between tabs', async ({ page }) => {
    await page.goto('/opps')
    await page.getByRole('link', { name: 'Deals' }).click()
    await expect(page).toHaveURL(/\/deals/)
    await page.getByRole('link', { name: 'Accounts' }).click()
    await expect(page).toHaveURL(/\/accounts/)
    await page.getByRole('link', { name: 'Contacts' }).click()
    await expect(page).toHaveURL(/\/contacts/)
  })
})
