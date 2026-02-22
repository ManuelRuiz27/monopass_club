import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test, type Page, type Route } from '@playwright/test'

const landingShotsDir = path.resolve(process.cwd(), '..', 'landing', 'public', 'assets', 'screenshots')
const animDir = path.join(landingShotsDir, 'anim')

function ensureDirs() {
  mkdirSync(landingShotsDir, { recursive: true })
  mkdirSync(animDir, { recursive: true })
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

async function applyLandingCaptureLayout(page: Page) {
  await page.addStyleTag({
    content: `
      .app-main {
        padding: 0.55rem 0.7rem 5rem !important;
      }
      .app-header {
        padding: 0.75rem 0.8rem !important;
        background: #06070d !important;
      }
      .app-brand-logo {
        width: 118px !important;
      }
      .app-bottom-nav {
        background: rgba(6, 12, 14, 0.88) !important;
        border-top-color: rgba(90, 196, 136, 0.38) !important;
      }
      .bottom-nav-item.active {
        background: linear-gradient(160deg, rgba(15, 84, 65, 0.94), rgba(12, 96, 74, 0.92)) !important;
        color: #90f2cb !important;
      }
      .scanner-stage {
        min-height: auto !important;
        gap: 0.58rem !important;
        padding: 0.68rem !important;
      }
      .scanner-stage__brand,
      .scanner-stage__footer {
        display: none !important;
      }
      .scanner-stage__header-art {
        width: 52px !important;
      }
      .scanner-stage__title {
        margin-top: 0 !important;
        font-size: 2.22rem !important;
        line-height: 1.08 !important;
      }
      .scanner-stage__subtitle {
        margin-top: 0.28rem !important;
        font-size: 0.92rem !important;
      }
      .scanner-stage__sales {
        max-width: none !important;
      }
      .scanner-stage__viewport {
        width: 100% !important;
        height: 332px !important;
        min-height: 332px !important;
        max-height: 332px !important;
        aspect-ratio: auto !important;
      }
      .scanner-stage__guide-box {
        width: min(66%, 220px) !important;
      }
      .scanner-stage__watermark {
        opacity: 0.08 !important;
      }
      .scanner-inline-issue {
        display: none !important;
      }
      #reader__dashboard {
        display: none !important;
      }
    `,
  })
}

async function applyStaffCaptureLayout(page: Page) {
  await page.addStyleTag({
    content: `
      .manager-scanners-create,
      .manager-scanners-toolbar,
      .manager-scanners-table-wrap,
      .manager-scanners-mobile-list,
      .bottom-sheet-backdrop {
        display: none !important;
      }
      .manager-scanners-page {
        gap: 12px !important;
      }
      .manager-scanners-proof {
        grid-template-columns: 1fr !important;
      }
    `,
  })
}

async function installScannerStoryboardStyles(page: Page) {
  await page.addStyleTag({
    content: `
      .story-layer {
        position: absolute;
        inset: 0;
        z-index: 3;
        pointer-events: none;
      }
      .story-camera-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(204, 255, 0, 0.7);
        background: rgba(5, 9, 20, 0.82);
        color: #d6ff7a;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        box-shadow: 0 0 14px rgba(204, 255, 0, 0.35);
      }
      .story-scan-target {
        position: absolute;
        inset: 24% 18%;
        border: 2px dashed rgba(18, 245, 255, 0.72);
        border-radius: 14px;
        box-shadow: 0 0 22px rgba(18, 245, 255, 0.25);
      }
      .story-scan-target::before,
      .story-scan-target::after {
        content: "";
        position: absolute;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(204, 255, 0, 0.9);
      }
      .story-scan-target::before {
        top: -3px;
        left: -3px;
        border-right: none;
        border-bottom: none;
      }
      .story-scan-target::after {
        right: -3px;
        bottom: -3px;
        border-left: none;
        border-top: none;
      }
      .story-ticket-overlay {
        position: absolute;
        right: 6%;
        bottom: 16%;
        width: 60%;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 16px 30px rgba(0, 0, 0, 0.5), 0 0 22px rgba(91, 46, 255, 0.45);
        transform: rotate(-10deg);
        opacity: 0.95;
      }
      .story-ticket-overlay--scan {
        right: 20%;
        bottom: 22%;
        width: 58%;
        transform: rotate(-6deg);
        box-shadow: 0 20px 36px rgba(0, 0, 0, 0.56), 0 0 28px rgba(18, 245, 255, 0.42);
      }
      .story-ticket-arrow {
        position: absolute;
        right: 42%;
        bottom: 33%;
        width: 20%;
        height: 2px;
        background: linear-gradient(90deg, rgba(204, 255, 0, 0), rgba(204, 255, 0, 0.95));
        transform: rotate(-32deg);
        box-shadow: 0 0 12px rgba(204, 255, 0, 0.55);
      }
      .story-ticket-arrow::after {
        content: "";
        position: absolute;
        right: -1px;
        top: -3px;
        width: 8px;
        height: 8px;
        border-top: 2px solid rgba(204, 255, 0, 0.95);
        border-right: 2px solid rgba(204, 255, 0, 0.95);
        transform: rotate(45deg);
      }
      .story-scan-sweep {
        position: absolute;
        left: 8%;
        right: 8%;
        top: 54%;
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(204, 255, 0, 0), rgba(204, 255, 0, 0.95), rgba(18, 245, 255, 0));
        box-shadow: 0 0 18px rgba(204, 255, 0, 0.6), 0 0 22px rgba(18, 245, 255, 0.4);
      }
      .story-validating-chip {
        position: absolute;
        top: 48px;
        right: 12px;
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid rgba(18, 245, 255, 0.8);
        background: rgba(5, 9, 20, 0.82);
        color: #8befff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    `,
  })
}

async function setScannerStoryboardPhase(page: Page, phase: 'camera' | 'ticket' | 'validating' | 'clear') {
  await page.evaluate((value) => {
    const existing = document.getElementById('story-layer')
    if (existing) existing.remove()
    if (value === 'clear') return

    const viewport = document.querySelector('.scanner-stage__viewport')
    if (!viewport) return

    const layer = document.createElement('div')
    layer.id = 'story-layer'
    layer.className = 'story-layer'

    if (value !== 'camera') {
      const badge = document.createElement('div')
      badge.className = 'story-camera-badge'
      badge.textContent = 'Camara activa - permiso concedido'
      layer.appendChild(badge)
    }

    const target = document.createElement('div')
    target.className = 'story-scan-target'
    layer.appendChild(target)

    if (value === 'ticket') {
      const ticket = document.createElement('img')
      ticket.className = 'story-ticket-overlay'
      ticket.src = '/assets/logos/ticket-demo-pass-monkey.png'
      ticket.alt = ''
      layer.appendChild(ticket)

      const arrow = document.createElement('span')
      arrow.className = 'story-ticket-arrow'
      layer.appendChild(arrow)
    }

    if (value === 'validating') {
      const ticket = document.createElement('img')
      ticket.className = 'story-ticket-overlay story-ticket-overlay--scan'
      ticket.src = '/assets/logos/ticket-demo-pass-monkey.png'
      ticket.alt = ''
      layer.appendChild(ticket)

      const sweep = document.createElement('span')
      sweep.className = 'story-scan-sweep'
      layer.appendChild(sweep)

      const chip = document.createElement('div')
      chip.className = 'story-validating-chip'
      chip.textContent = 'Ticket enviado a validacion'
      layer.appendChild(chip)
    }

    viewport.appendChild(layer)

    const reader = document.querySelector('.scanner-stage__reader > div') as HTMLElement | null
    if (reader) {
      reader.style.background =
        'radial-gradient(180px 100px at 70% 20%, rgba(18,245,255,.14), transparent 70%), radial-gradient(200px 120px at 25% 85%, rgba(91,46,255,.22), transparent 72%), #02040a'
    }
  }, phase)
}

async function setSyntheticResultOverlay(page: Page, tone: 'success' | 'error', title: string, message: string) {
  await page.evaluate(
    ({ overlayTone, overlayTitle, overlayMessage }) => {
      const viewport = document.querySelector('.scanner-stage__viewport')
      if (!viewport) return

      const existing = document.getElementById('story-result-overlay')
      if (existing) existing.remove()

      const overlay = document.createElement('div')
      overlay.id = 'story-result-overlay'
      overlay.className = `scanner-overlay scanner-overlay--${overlayTone}`
      overlay.style.zIndex = '5'

      const card = document.createElement('div')
      card.className = 'scanner-overlay__card'

      const heading = document.createElement('h3')
      heading.textContent = overlayTitle
      card.appendChild(heading)

      const copy = document.createElement('p')
      copy.textContent = overlayMessage
      card.appendChild(copy)

      overlay.appendChild(card)
      viewport.appendChild(overlay)
    },
    { overlayTone: tone, overlayTitle: title, overlayMessage: message },
  )
}

async function clearSyntheticResultOverlay(page: Page) {
  await page.evaluate(() => {
    document.getElementById('story-result-overlay')?.remove()
  })
}

async function captureScannerViewport(page: Page, filePath: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(60)
  await page.screenshot({ path: filePath, fullPage: false, scale: 'css' })
}

async function seedSession(page: Page, role: 'MANAGER' | 'SCANNER', userId: string) {
  await page.addInitScript(
    ({ id, userRole }) => {
      window.localStorage.setItem(
        'monopass_session',
        JSON.stringify({
          token: 'mock-token',
          userId: id,
          role: userRole,
        }),
      )
    },
    { id: userId, userRole: role },
  )
}

async function mockScannerApis(page: Page) {
  await page.route('**/scan/validate', async (route: Route) => {
    const body = route.request().postDataJSON() as { qrToken?: string } | undefined
    const token = body?.qrToken ?? ''

    await new Promise((resolve) => setTimeout(resolve, 420))

    if (token.toUpperCase().includes('DUP')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: false,
          reason: 'ALREADY_SCANNED',
          ticket: {
            ticketId: 'dup-001',
            eventId: 'club-noir',
            guestType: 'GENERAL',
            displayLabel: 'General',
            note: null,
            status: 'SCANNED',
            scannedAt: new Date().toISOString(),
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: true,
        reason: null,
        ticket: {
          ticketId: 'ok-001',
          eventId: 'club-noir',
          guestType: 'VIP',
          displayLabel: 'VIP',
          note: null,
          status: 'PENDING',
          scannedAt: null,
        },
      }),
    })
  })

  await page.route('**/scan/confirm', async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        confirmed: true,
        reason: null,
        ticket: {
          ticketId: 'ok-001',
          eventId: 'club-noir',
          guestType: 'VIP',
          displayLabel: 'VIP',
          note: null,
          status: 'SCANNED',
          scannedAt: new Date().toISOString(),
        },
      }),
    })
  })
}

async function mockManagerApis(page: Page) {
  await page.route('**/scanners', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'scanner-01',
            active: true,
            lastScanAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
            user: { name: 'Axel Cruz', username: 'axel.scanner' },
          },
          {
            id: 'scanner-02',
            active: true,
            lastScanAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
            user: { name: 'Diana Flores', username: 'diana.door' },
          },
          {
            id: 'scanner-03',
            active: false,
            lastScanAt: null,
            user: { name: 'Mauro Ruiz', username: 'mauro.staff' },
          },
        ]),
      })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
}

async function stabilize(page: Page, selector: string) {
  await page.waitForLoadState('networkidle')
  await page.waitForSelector(selector, { state: 'visible', timeout: 15000 })
  await page.waitForTimeout(900)
}

test.beforeAll(() => {
  ensureDirs()
})

test('capture scanner story frames and key screenshots', async ({ page }) => {
  await seedSession(page, 'SCANNER', 'axel.cruz')
  await page.addInitScript(() => {
    const mockStream = new MediaStream()

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => mockStream,
        enumerateDevices: async () => [{ kind: 'videoinput', deviceId: 'mock-camera-01', label: 'Mock camera' }],
      },
    })

    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: async () => ({ state: 'granted' }),
      },
    })
  })

  await mockScannerApis(page)
  await page.goto('/scanner')
  await hideDevtools(page)
  await stabilize(page, '.scanner-stage')
  await applyLandingCaptureLayout(page)
  await installScannerStoryboardStyles(page)

  await setScannerStoryboardPhase(page, 'clear')
  await captureScannerViewport(page, path.join(landingShotsDir, 'scanner-home.png'))
  await captureScannerViewport(page, path.join(animDir, 'scanner-video-frame-01-home.png'))

  await setScannerStoryboardPhase(page, 'ticket')
  await page.waitForTimeout(120)
  await captureScannerViewport(page, path.join(animDir, 'scanner-video-frame-02-ticket-loaded.png'))

  await setScannerStoryboardPhase(page, 'validating')
  await page.waitForTimeout(170)
  await captureScannerViewport(page, path.join(animDir, 'scanner-video-frame-03-validando.png'))

  await setScannerStoryboardPhase(page, 'clear')
  await setSyntheticResultOverlay(page, 'success', 'Acceso validado', 'Entrada confirmada en segundos.')
  await captureScannerViewport(page, path.join(landingShotsDir, 'scanner-validado.png'))
  await captureScannerViewport(page, path.join(animDir, 'scanner-video-frame-04-validado.png'))
  await clearSyntheticResultOverlay(page)

  await setSyntheticResultOverlay(page, 'error', 'Acceso invalido', 'Ticket duplicado bloqueado en puerta.')
  await captureScannerViewport(page, path.join(landingShotsDir, 'scanner-fraude.png'))
  await captureScannerViewport(page, path.join(landingShotsDir, 'scanner-rechazado.png'))
  await captureScannerViewport(page, path.join(animDir, 'scanner-video-frame-05-fraude.png'))
  await clearSyntheticResultOverlay(page)
})

test('capture staff scanner dashboard frames', async ({ page }) => {
  await seedSession(page, 'MANAGER', 'gerardo.alvarez')
  await mockManagerApis(page)
  await page.goto('/manager/team/staff')
  await hideDevtools(page)
  await stabilize(page, '.manager-scanners-page')
  await applyStaffCaptureLayout(page)
  await page.waitForTimeout(350)

  await page.screenshot({ path: path.join(landingShotsDir, 'staff-scanner-dashboard.png') })
  await page.screenshot({ path: path.join(animDir, 'staff-video-frame-01-dashboard.png') })

  await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(animDir, 'staff-video-frame-02-kpis.png') })

  await page.evaluate(() => window.scrollTo({ top: 540, behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(animDir, 'staff-video-frame-03-table.png') })
})

