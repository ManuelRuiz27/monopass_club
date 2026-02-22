import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

function parseCurrencyToCents(text: string) {
  const raw = text.replace(/[^\d.,-]/g, '')
  if (!raw) return 0
  const normalized = raw.includes('.') ? raw.replace(/,/g, '') : raw.replace(/,/g, '.')
  const amount = Number.parseFloat(normalized)
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}

function dateInputToNoonIso(dateInput: string) {
  return new Date(`${dateInput}T12:00:00.000Z`).toISOString()
}

async function readKpiCurrencyCents(page: Page, label: string) {
  const card = page.locator('.director-kpi').filter({ hasText: label }).first()
  await expect(card).toBeVisible()
  const valueText = (await card.locator('strong').first().innerText()).trim()
  return parseCurrencyToCents(valueText)
}

async function readFinanceGrossViaApi(page: Page, dateFrom: string, dateTo: string) {
  return page.evaluate(async ({ fromIso, toIso }) => {
    const url = `http://localhost:4000/director/finance/summary?dateFrom=${encodeURIComponent(fromIso)}&dateTo=${encodeURIComponent(toIso)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`finance summary request failed: ${response.status}`)
    const data = await response.json()
    return Number(data?.result?.grossIncomeMxn ?? 0)
  }, { fromIso: dateInputToNoonIso(dateFrom), toIso: dateInputToNoonIso(dateTo) })
}

test.describe('Director Monetization Smoke', () => {
  test('creates plan, subscription, invoice, payment and updates finance summary', async ({ page }) => {
    test.setTimeout(120_000)
    const suffix = `${Date.now()}`
    const planName = `QA Plan ${suffix}`
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)

    await page.goto('/login')

    await page.fill('input[type="text"]', 'director.demo')
    await page.fill('input[type="password"]', 'changeme123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/director$/)

    await page.goto('/director/finance')
    await expect(page.getByRole('heading', { name: /Finanzas/i })).toBeVisible()
    await page.getByLabel('Hasta').fill(tomorrow)
    await page.getByRole('button', { name: /Recalcular/i }).click()
    const financeFrom = await page.getByLabel('Desde').inputValue()
    const grossBefore = await readKpiCurrencyCents(page, 'Ingresos brutos')
    const grossBeforeApi = await readFinanceGrossViaApi(page, financeFrom, tomorrow)
    expect(grossBeforeApi).toBe(grossBefore)

    await page.goto('/director/plans')
    await expect(page.getByRole('heading', { name: /Planes/i })).toBeVisible()
    await page.getByLabel('Nombre').fill(planName)
    await page.getByRole('button', { name: /^Crear plan$/ }).click()
    await expect(page.getByRole('cell', { name: planName })).toBeVisible()

    await page.goto('/director/subscriptions')
    await expect(page.getByRole('heading', { name: /Suscripciones/i })).toBeVisible()

    const subscriptionClubSelect = page.getByLabel('Club')
    await subscriptionClubSelect.selectOption({ index: 1 })
    const selectedClubName = ((await subscriptionClubSelect.locator('option:checked').textContent()) ?? '').trim()
    expect(selectedClubName).not.toBe('')

    const subscriptionPlanSelect = page.getByLabel('Plan')
    const subscriptionPlanOptions = (await subscriptionPlanSelect.locator('option').allTextContents()).map((s) => s.trim())
    const selectablePlanLabel = subscriptionPlanOptions.find((label) => label === planName) ?? subscriptionPlanOptions.find((label) => label && label !== 'Selecciona...')
    expect(selectablePlanLabel).toBeTruthy()
    await subscriptionPlanSelect.selectOption({ label: selectablePlanLabel! })
    await page.getByRole('button', { name: /Crear suscripcion/i }).click()
    await expect(page.locator('.director-table tbody tr').first()).toBeVisible()

    await page.goto('/director/billing')
    await expect(page.getByRole('heading', { name: /Billing/i })).toBeVisible()

    const createInvoiceCard = page.locator('section.card').filter({ hasText: 'Crear factura' }).first()
    const invoiceFormSelects = createInvoiceCard.locator('.form-grid select')
    await invoiceFormSelects.nth(0).selectOption({ label: selectedClubName })
    const billingSubscriptionSelect = invoiceFormSelects.nth(1)
    const subscriptionOptions = (await billingSubscriptionSelect.locator('option').allTextContents()).map((s) => s.trim())
    const matchingSubscriptionLabel = subscriptionOptions.find((label) => label.includes(planName))
    if (matchingSubscriptionLabel) {
      await billingSubscriptionSelect.selectOption({ label: matchingSubscriptionLabel })
    }
    await createInvoiceCard.getByRole('button', { name: /^Crear factura$/ }).click()

    const detailCard = page.locator('section.card').filter({ hasText: 'Detalle / Cobro' }).first()
    await expect(detailCard.getByRole('heading', { name: /Detalle \/ Cobro/i })).toBeVisible()
    await detailCard.getByLabel(/Monto \(cents\)/i).fill('200000')
    await detailCard.getByRole('button', { name: /Registrar pago/i }).click()
    await expect(detailCard.getByText(/Estado paid/i)).toBeVisible()

    await page.goto('/director/finance')
    await expect(page.getByRole('heading', { name: /Finanzas/i })).toBeVisible()
    await page.getByLabel('Hasta').fill(tomorrow)
    await page.getByRole('button', { name: /Recalcular/i }).click()
    const grossAfter = await readKpiCurrencyCents(page, 'Ingresos brutos')
    const grossAfterApi = await readFinanceGrossViaApi(page, financeFrom, tomorrow)
    expect(grossAfterApi).toBeGreaterThanOrEqual(grossBeforeApi)
    expect(grossAfterApi).toBeGreaterThan(0)
    expect(grossAfter).toBeGreaterThanOrEqual(grossBefore)

    await page.goto('/director/revenue')
    await expect(page.getByRole('heading', { name: /Revenue Dashboard/i })).toBeVisible()
    const revenue30d = await readKpiCurrencyCents(page, 'Revenue 30d')
    expect(revenue30d).toBeGreaterThan(0)

    await page.goto('/director/finance')
    await expect(page.getByRole('heading', { name: /Finanzas/i })).toBeVisible()
  })
})
