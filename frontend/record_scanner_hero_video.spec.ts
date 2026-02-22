import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test } from '@playwright/test'

test('record scanner hero video with demo ticket scan', async ({ browser }) => {
  test.setTimeout(180000)

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: {
      dir: 'videos',
      size: { width: 390, height: 844 },
    },
  })

  const page = await context.newPage()
  const videoHandle = page.video()

  await page.addInitScript(() => {
    const session = {
      token: 'mock-token-scanner',
      userId: 'scanner-hero-video',
      role: 'SCANNER',
    }

    localStorage.setItem('monopass_session', JSON.stringify(session))

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: async () => new MediaStream(),
        enumerateDevices: async () => [{ kind: 'videoinput', deviceId: 'mock-cam', label: 'Mock Camera' }],
      },
    })

    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: async () => ({ state: 'granted' }),
      },
    })

    const injectCaptureStyles = () => {
      if (document.getElementById('scanner-hero-video-capture-style')) return

      const style = document.createElement('style')
      style.id = 'scanner-hero-video-capture-style'
      style.textContent = `
        body {
          margin: 0;
          background: #02050c !important;
        }

        body > :not(#root) {
          display: none !important;
        }

        #root {
          width: 390px;
          height: 844px;
          margin: 0 auto;
        }

        .scanner-stage {
          min-height: 844px !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .scanner-stage__header,
        .scanner-stage__footer {
          display: none !important;
        }

        [data-gsap-scan-ops],
        .scanner-inline-issue {
          display: none !important;
        }

        #root *[style*='position: fixed'] {
          display: none !important;
        }

        .scanner-stage__viewport {
          min-height: 844px !important;
          height: 844px !important;
          border: none !important;
          border-radius: 0 !important;
        }

        .scanner-stage__reader video {
          opacity: 0.16 !important;
          filter: blur(1px) brightness(0.62);
        }

        .scanner-hero-demo-ticket {
          position: absolute;
          left: 50%;
          top: 108%;
          width: min(72vw, 258px);
          transform: translate(-50%, 0) rotate(-4deg);
          transform-origin: center center;
          filter: drop-shadow(0 24px 28px rgba(0, 0, 0, 0.6));
          z-index: 1;
          animation: scanner-hero-ticket-in 1.28s cubic-bezier(0.2, 0.75, 0.22, 1) forwards;
        }

        @keyframes scanner-hero-ticket-in {
          0% {
            top: 108%;
            transform: translate(-50%, 0) scale(1) rotate(-4deg);
          }
          74% {
            top: 52%;
            transform: translate(-50%, -50%) scale(1) rotate(-1.5deg);
          }
          100% {
            top: 51%;
            transform: translate(-50%, -50%) scale(0.94) rotate(-1deg);
          }
        }
      `

      document.documentElement.appendChild(style)
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectCaptureStyles, { once: true })
    } else {
      injectCaptureStyles()
    }
  })

  await page.route('**/scan/validate', async (route) => {
    const payload = route.request().postDataJSON() as { qrToken?: string }

    if (payload?.qrToken === 'VALID-TOKEN') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          reason: null,
          ticket: {
            ticketId: 'ticket-demo-001',
            eventId: 'event-demo-001',
            guestType: 'VIP',
            displayLabel: 'Invitado Demo VIP',
            note: null,
            status: 'PENDING',
            scannedAt: null,
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: false,
        reason: 'INVALID_TOKEN',
        ticket: null,
      }),
    })
  })

  await page.route('**/scan/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        confirmed: true,
        reason: null,
        ticket: {
          ticketId: 'ticket-demo-001',
          eventId: 'event-demo-001',
          guestType: 'VIP',
          displayLabel: 'Invitado Demo VIP',
          note: null,
          status: 'SCANNED',
          scannedAt: new Date().toISOString(),
        },
      }),
    })
  })

  await page.goto('http://127.0.0.1:5173/scanner', { waitUntil: 'networkidle' })
  await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' })

  await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>('.scanner-stage__viewport')
    if (!viewport) return

    const ticket = document.createElement('img')
    ticket.className = 'scanner-hero-demo-ticket'
    ticket.src = '/assets/logos/ticket-demo-pass-monkey.png'
    ticket.alt = 'Ticket demo Pass Monkey'
    viewport.appendChild(ticket)
  })

  await page.waitForTimeout(1300)
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('pm:scanner:simulate', { detail: { token: 'VALID-TOKEN' } }))
  })
  await page.waitForTimeout(3000)

  await context.close()

  if (!videoHandle) {
    throw new Error('No se pudo obtener el handle de video para exportar scanner-demo')
  }

  const webmOutput = path.resolve('../landing/public/assets/videos/scanner-demo.webm')
  const mp4Output = path.resolve('../landing/public/assets/videos/scanner-demo.mp4')
  const rawWebm = path.resolve('videos/scanner-demo-raw.webm')

  fs.mkdirSync(path.dirname(webmOutput), { recursive: true })
  await videoHandle.saveAs(rawWebm)

  try {
    const trimStart = 0.8
    const filter = 'drawbox=x=iw-52:y=ih-52:w=52:h=52:color=#02050c@1:t=fill'

    execSync(
      `ffmpeg -y -ss ${trimStart} -i "${rawWebm}" -vf "${filter}" -c:v libvpx -crf 30 -b:v 0 -an "${webmOutput}"`,
      {
        stdio: 'ignore',
      },
    )

    execSync(`ffmpeg -y -ss ${trimStart} -i "${rawWebm}" -vf "${filter}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4Output}"`, {
      stdio: 'ignore',
    })
  } catch {
    // Fallback when ffmpeg is unavailable.
    fs.copyFileSync(rawWebm, webmOutput)
  }
})
