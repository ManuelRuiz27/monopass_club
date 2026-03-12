import { expect, test } from '@playwright/test'

test.describe('Scanner Confirm Conflict', () => {
  test('muestra ticket ya usado cuando confirm responde 409', async ({ page }) => {
    await page.addInitScript(() => {
      const session = {
        token: 'mock-token-scanner',
        userId: 'scanner-1',
        role: 'SCANNER',
      }

      window.localStorage.setItem('monopass_session', JSON.stringify(session))
      window.localStorage.setItem('monopass_token', session.token)

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: async () => new MediaStream(),
        },
        configurable: true,
      })

      Object.defineProperty(navigator, 'permissions', {
        value: {
          query: async () => ({ state: 'granted' }),
        },
        configurable: true,
      })
    })

    await page.route('**/scan/validate', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          valid: true,
          reason: null,
          ticket: {
            ticketId: 'ticket-1',
            eventId: 'event-1',
            guestType: 'GENERAL',
            displayLabel: 'GENERAL',
            note: null,
            status: 'PENDING',
            scannedAt: null,
          },
        },
      })
    })

    await page.route('**/scan/confirm', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          confirmed: false,
          reason: 'ALREADY_SCANNED',
          ticket: {
            ticketId: 'ticket-1',
            eventId: 'event-1',
            guestType: 'GENERAL',
            displayLabel: 'GENERAL',
            note: null,
            status: 'SCANNED',
            scannedAt: new Date().toISOString(),
          },
        }),
      })
    })

    test.setTimeout(60000)

    await page.goto('/scanner', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' })

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pm:scanner:simulate', { detail: { token: 'USED-ON-CONFIRM-0001' } }))
    })

    await expect(page.locator('.scanner-overlay__card')).toBeVisible()
    await expect(page.locator('.scanner-overlay__card')).toContainText('Este ticket ya fue utilizado.')
    await expect(page.locator('.scanner-inline-issue')).toHaveCount(0)
  })
})
