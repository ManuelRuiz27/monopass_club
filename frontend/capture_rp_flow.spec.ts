import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test, type Page, type Route } from '@playwright/test'

const shotsDir = path.resolve(process.cwd(), '..', 'landing', 'public', 'assets', 'screenshots')

type MockTicket = {
  id: string
  guestType: 'GENERAL' | 'VIP' | 'OTHER'
  displayLabel: string
  status: 'PENDING' | 'SCANNED'
  note: string | null
  createdAt: string
  scannedAt: string | null
  event: {
    id: string
    name: string
    startsAt: string
    active: boolean
  }
}

function createTicketSvg(ticketId: string, guestType: string) {
  const safeId = ticketId.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safeType = guestType.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
  <defs>
    <linearGradient id="rp-ticket-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5B2EFF" />
      <stop offset="58%" stop-color="#12F5FF" />
      <stop offset="100%" stop-color="#CCFF00" />
    </linearGradient>
  </defs>
  <rect width="720" height="720" fill="#070812" />
  <rect x="44" y="44" width="632" height="632" rx="28" fill="#131629" stroke="url(#rp-ticket-g)" stroke-width="4" />
  <text x="360" y="116" text-anchor="middle" fill="#E7E3FF" font-size="34" font-family="Arial, sans-serif">PASS MONKEY ACCESS</text>
  <text x="360" y="152" text-anchor="middle" fill="#9FAAD2" font-size="18" font-family="Arial, sans-serif">${safeType}</text>
  <rect x="200" y="186" width="320" height="320" rx="20" fill="#FFFFFF" />
  <rect x="224" y="210" width="272" height="272" fill="#111" />
  <path d="M240 224h48v48h-48zM304 224h16v16h-16zM336 224h16v16h-16zM368 224h16v16h-16zM400 224h16v16h-16zM432 224h48v48h-48zM240 288h16v16h-16zM272 288h16v16h-16zM320 288h16v16h-16zM352 288h16v16h-16zM384 288h16v16h-16zM432 288h16v16h-16zM464 288h16v16h-16zM240 320h16v16h-16zM304 320h16v16h-16zM336 320h16v16h-16zM400 320h16v16h-16zM432 320h16v16h-16zM240 352h16v16h-16zM272 352h16v16h-16zM320 352h16v16h-16zM352 352h16v16h-16zM400 352h16v16h-16zM432 352h16v16h-16zM464 352h16v16h-16zM240 384h48v48h-48zM304 416h16v16h-16zM336 384h16v16h-16zM368 416h16v16h-16zM400 384h16v16h-16zM432 384h48v48h-48z" fill="#FFF" />
  <text x="360" y="568" text-anchor="middle" fill="#F4F6FF" font-size="28" font-family="Arial, sans-serif">${safeId}</text>
  <text x="360" y="606" text-anchor="middle" fill="#95A2CC" font-size="20" font-family="Arial, sans-serif">VIP NIGHT // MONOPASS DEMO</text>
</svg>
`.trim()
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

async function applyCaptureLayout(page: Page) {
  await page.addStyleTag({
    content: `
      body {
        background: #020204 !important;
      }
      #root {
        margin: 0 auto !important;
      }
      [data-gsap-route-panel] {
        opacity: 1 !important;
        transform: none !important;
      }
    `,
  })
}

async function addDemoRibbon(page: Page, text: string, status: string, tone: 'cyan' | 'lime' | 'purple' = 'cyan') {
  await page.evaluate(
    ({ ribbonText, ribbonStatus, ribbonTone }) => {
      document.getElementById('rp-demo-ribbon')?.remove()

      const shell = document.querySelector('.app-shell-unified')
      if (!shell) return

      const toneMap: Record<string, { border: string; bg: string; text: string }> = {
        cyan: { border: 'rgba(18,245,255,.8)', bg: 'rgba(4,16,29,.84)', text: '#8ef6ff' },
        lime: { border: 'rgba(204,255,0,.82)', bg: 'rgba(15,23,4,.85)', text: '#dcff85' },
        purple: { border: 'rgba(145,111,255,.8)', bg: 'rgba(17,8,30,.85)', text: '#d5c7ff' },
      }

      const tone = toneMap[ribbonTone] ?? toneMap.cyan
      const ribbon = document.createElement('div')
      ribbon.id = 'rp-demo-ribbon'
      ribbon.style.position = 'fixed'
      ribbon.style.left = '12px'
      ribbon.style.top = '10px'
      ribbon.style.zIndex = '9999'
      ribbon.style.padding = '7px 11px'
      ribbon.style.borderRadius = '11px'
      ribbon.style.border = `1px solid ${tone.border}`
      ribbon.style.background = tone.bg
      ribbon.style.backdropFilter = 'blur(8px)'
      ribbon.style.boxShadow = '0 8px 22px rgba(0,0,0,.35)'
      ribbon.style.maxWidth = '350px'

      const title = document.createElement('div')
      title.style.fontSize = '11px'
      title.style.letterSpacing = '.08em'
      title.style.textTransform = 'uppercase'
      title.style.fontWeight = '700'
      title.style.color = tone.text
      title.textContent = ribbonText

      const statusNode = document.createElement('div')
      statusNode.style.marginTop = '2px'
      statusNode.style.fontSize = '14px'
      statusNode.style.fontWeight = '700'
      statusNode.style.color = '#f3f7ff'
      statusNode.textContent = ribbonStatus

      ribbon.appendChild(title)
      ribbon.appendChild(statusNode)
      shell.appendChild(ribbon)
    },
    { ribbonText: text, ribbonStatus: status, ribbonTone: tone },
  )
}

async function mockRpApis(page: Page) {
  const now = Date.now()
  const eventStartsAt = new Date(now + 1000 * 60 * 60 * 24).toISOString()
  const eventEndsAt = new Date(now + 1000 * 60 * 60 * 30).toISOString()
  const event = {
    assignmentId: 'asg-rp-01',
    eventId: 'evt-rp-01',
    eventName: 'VORTEX SATURDAY',
    clubName: 'PASS MONKEY CLUB',
    startsAt: eventStartsAt,
    endsAt: eventEndsAt,
    limitAccesses: 120,
    usedAccesses: 64,
    remainingAccesses: 56,
    guestTypeCounts: { GENERAL: 38, VIP: 21, OTHER: 5 },
    eventActive: true,
  }

  const tickets: MockTicket[] = [
    {
      id: 'TCK-RP-4491',
      guestType: 'VIP',
      displayLabel: 'VIP',
      status: 'SCANNED',
      note: 'Mesa Luna',
      createdAt: new Date(now - 1000 * 60 * 62).toISOString(),
      scannedAt: new Date(now - 1000 * 60 * 40).toISOString(),
      event: { id: event.eventId, name: event.eventName, startsAt: eventStartsAt, active: true },
    },
    {
      id: 'TCK-RP-4492',
      guestType: 'GENERAL',
      displayLabel: 'GENERAL',
      status: 'PENDING',
      note: null,
      createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
      scannedAt: null,
      event: { id: event.eventId, name: event.eventName, startsAt: eventStartsAt, active: true },
    },
  ]

  await page.route('**://localhost:4000/rp/events', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ otherLabel: 'CORTESIA', events: [event] }),
    })
  })

  await page.route('**://localhost:4000/tickets', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    const request = route.request().postDataJSON() as { guestType?: 'GENERAL' | 'VIP' | 'OTHER'; note?: string } | undefined
    const guestType = request?.guestType ?? 'GENERAL'
    const note = request?.note ?? null
    const id = `TCK-RP-${Math.floor(1000 + Math.random() * 8999)}`

    event.usedAccesses += 1
    event.remainingAccesses = Math.max(0, (event.remainingAccesses ?? 0) - 1)
    event.guestTypeCounts[guestType] += 1

    tickets.unshift({
      id,
      guestType,
      displayLabel: guestType === 'OTHER' ? 'CORTESIA' : guestType,
      status: 'PENDING',
      note,
      createdAt: new Date().toISOString(),
      scannedAt: null,
      event: { id: event.eventId, name: event.eventName, startsAt: event.startsAt, active: true },
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id,
        guestType,
        note,
        status: 'PENDING',
        event: {
          id: event.eventId,
          name: event.eventName,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        },
        limitAccesses: event.limitAccesses,
        usedAccesses: event.usedAccesses,
        remainingAccesses: event.remainingAccesses,
      }),
    })
  })

  await page.route('**://localhost:4000/rp/tickets/history**', async (route: Route) => {
    const url = new URL(route.request().url())
    const guestType = url.searchParams.get('guestType')
    const filtered = guestType ? tickets.filter((item) => item.guestType === guestType) : tickets

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        otherLabel: 'CORTESIA',
        tickets: filtered,
      }),
    })
  })

  await page.route('**://localhost:4000/tickets/*/png', async (route: Route) => {
    const ticketId = route.request().url().split('/').at(-2) ?? 'TCK-DEMO'
    const ticket = tickets.find((item) => item.id === ticketId)
    const svg = createTicketSvg(ticketId, ticket?.displayLabel ?? 'VIP')
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg })
  })
}

test.beforeAll(() => {
  mkdirSync(shotsDir, { recursive: true })
})

test.describe('RP Flow Capture', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'monopass_session',
        JSON.stringify({
          token: 'mock-token-rp',
          userId: 'sofia.ramirez',
          role: 'RP',
        }),
      )
    })

    await mockRpApis(page)
  })

  test('capture rp sales screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto('/rp/events')
    await hideDevtools(page)
    await applyCaptureLayout(page)
    await page.waitForSelector('.rp-event-row', { state: 'visible', timeout: 15000 })
    await page.waitForTimeout(900)
    await addDemoRibbon(page, 'RP DEMO - Sofia Ramirez', 'Lista de eventos y ventas por link', 'cyan')
    await page.screenshot({ path: path.join(shotsDir, 'rp-dashboard.png') })

    await page.locator('.rp-event-row').first().click()
    await page.waitForSelector('.modal[open]', { state: 'visible', timeout: 10000 })
    await page.waitForSelector('.rp-event-quick-panel__form', { state: 'visible', timeout: 10000 })
    await page.locator('.rp-event-quick-panel__form').getByRole('button', { name: 'VIP', exact: true }).click()
    await page.locator('.rp-event-quick-panel__form .ui-input-control').first().fill('Valeria Torres | Mesa Norte | Flyer Insta')
    await addDemoRibbon(page, 'GENERACION EXPRESS', 'Pantalla por encima para generar accesos', 'purple')
    await page.waitForTimeout(350)
    await page.screenshot({ path: path.join(shotsDir, 'rp-form.png') })

    await page.getByRole('button', { name: /generar acceso ahora/i }).click()
    await page.waitForURL(/\/rp\/generated$/)
    await page.waitForSelector('.rp-generated-success', { state: 'visible', timeout: 10000 })
    await page.waitForSelector('.rp-generated-ticket__image', { state: 'visible', timeout: 10000 })
    await addDemoRibbon(page, 'RP SHARING', 'Acceso listo para enviar por WhatsApp', 'lime')
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(shotsDir, 'rp-sharing.png') })
    await page.screenshot({ path: path.join(shotsDir, 'rp-success.png') })

    await page.locator('.rp-generated-ticket').screenshot({ path: path.join(shotsDir, 'client-ticket.png') })

    await page.goto('/rp/history')
    await page.waitForSelector('.rp-history-page__title', { state: 'visible', timeout: 10000 })
    await addDemoRibbon(page, 'TRAZABILIDAD', 'Historial de accesos compartidos', 'cyan')
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(shotsDir, 'rp-history.png') })

    await page.goto('/rp/profile')
    await page.waitForSelector('.rp-profile-page__title', { state: 'visible', timeout: 10000 })
    await addDemoRibbon(page, 'PERFIL RP', 'Cuenta activa para operacion nocturna', 'purple')
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(shotsDir, 'rp-profile.png') })
  })
})
