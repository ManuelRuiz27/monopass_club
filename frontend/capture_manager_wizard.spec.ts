import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type Route } from '@playwright/test'

const animDir = path.resolve(process.cwd(), '..', 'landing', 'public', 'assets', 'screenshots', 'anim')
const flyerPath = path.resolve(process.cwd(), '..', 'landing', 'public', 'assets', 'logos', 'ticket-demo-pass-monkey.png')

function ensureDirs() {
  mkdirSync(animDir, { recursive: true })
}

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'monopass_session',
      JSON.stringify({
        token: 'mock-token',
        userId: 'manager-capture',
        role: 'MANAGER',
      }),
    )
  })
}

async function hideDevtools(page: Page) {
  await page.addStyleTag({
    content: `
      .tsqd-parent-container,
      .tsqd-container,
      .react-query-devtools,
      [data-testid="react-query-devtools-toggle"],
      button[aria-label*="TanStack"] {
        display: none !important;
      }
    `,
  })
}

async function captureFrame(page: Page, fileName: string) {
  await page.waitForTimeout(260)
  await page.screenshot({
    path: path.join(animDir, fileName),
    fullPage: false,
    scale: 'css',
  })
}

async function mockManagerWizardApis(page: Page) {
  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': '*',
  }

  await page.route('**/events', async (route: Route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue()
      return
    }

    const method = route.request().method()
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify([
          {
            id: 'evt-existing-1',
            name: 'Noche Neon',
            startsAt: new Date(Date.now() + 3_600_000).toISOString(),
            endsAt: new Date(Date.now() + 7_200_000).toISOString(),
            active: true,
            club: { id: 'club-1', name: 'Club Mono', active: true },
            assignments: [],
            templateImageUrl: null,
            qrPositionX: null,
            qrPositionY: null,
            qrSize: null,
          },
        ]),
      })
      return
    }

    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          id: 'evt-created-1',
          name: 'Evento Wizard Real',
          startsAt: new Date(Date.now() + 3_600_000).toISOString(),
          endsAt: new Date(Date.now() + 7_200_000).toISOString(),
          active: true,
          club: { id: 'club-1', name: 'Club Mono', active: true },
          assignments: [],
        }),
      })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: '{}' })
  })

  await page.route('**/clubs', async (route: Route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue()
      return
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify([
        { id: 'club-1', name: 'Club Mono', capacity: 800, active: true },
        { id: 'club-2', name: 'Club Orbit', capacity: 650, active: true },
      ]),
    })
  })

  await page.route('**/rps', async (route: Route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue()
      return
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify([
        {
          id: 'rp-1',
          active: true,
          user: { id: 'usr-rp-1', name: 'Mono', username: 'mono.rp' },
          assignments: [],
        },
        {
          id: 'rp-2',
          active: true,
          user: { id: 'usr-rp-2', name: 'Vale', username: 'vale.rp' },
          assignments: [],
        },
        {
          id: 'rp-3',
          active: true,
          user: { id: 'usr-rp-3', name: 'Rafa', username: 'rafa.rp' },
          assignments: [],
        },
      ]),
    })
  })

  await page.route('**/rp-groups', async (route: Route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue()
      return
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify([
        {
          id: 'grp-1',
          name: 'RPs Top',
          members: [
            { id: 'rp-1', user: { name: 'Mono' } },
            { id: 'rp-2', user: { name: 'Vale' } },
            { id: 'rp-3', user: { name: 'Rafa' } },
          ],
        },
      ]),
    })
  })

  await page.route('**/events/*/template', async (route: Route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue()
      return
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', headers: corsHeaders, body: '{}' })
  })

  await page.route('**/events/*/rps', async (route: Route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue()
      return
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        id: 'assign-1',
        eventId: 'evt-created-1',
        rpId: 'rp-1',
        limitAccesses: null,
        usedAccesses: 0,
      }),
    })
  })
}

test.beforeAll(() => {
  ensureDirs()
})

test('capture manager wizard real UI frames for landing animation', async ({ page }) => {
  test.setTimeout(120000)

  await page.setViewportSize({ width: 390, height: 844 })
  await seedSession(page)
  await mockManagerWizardApis(page)

  await page.goto('/manager/events')
  await hideDevtools(page)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('.manager-events-page', { state: 'visible', timeout: 15000 })

  await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((item) =>
      (item.textContent ?? '').includes('Nuevo Evento'),
    )
    button?.click()
  })
  await page.waitForSelector('.event-wizard', { state: 'visible', timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'Datos del evento' })).toBeVisible()
  await captureFrame(page, 'manager-wizard-frame-01-basics.png')

  await page.locator('.event-wizard label:has-text("Club") select').selectOption('club-1')
  await page.getByLabel('Nombre del evento').fill('Evento Wizard Real')
  await page.getByRole('button', { name: 'Siguiente' }).click()

  await expect(page.locator('.template-editor')).toBeVisible()
  await page.locator('.template-editor__file-input').first().setInputFiles(flyerPath)
  await expect(page.getByText('Imagen cargada')).toBeVisible()
  await captureFrame(page, 'manager-wizard-frame-02-flyer.png')

  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByRole('heading', { name: 'Asignar RPs' })).toBeVisible()
  await page.locator('.event-wizard-rps__group-select').selectOption('grp-1')
  await captureFrame(page, 'manager-wizard-frame-03-rps.png')

  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByRole('heading', { name: 'Confirmar evento' })).toBeVisible()
  await captureFrame(page, 'manager-wizard-frame-04-confirm.png')
})
