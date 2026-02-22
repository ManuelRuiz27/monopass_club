import { test, expect } from '@playwright/test'

test('record real scanner flow', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()))

    // 1. Mock Session via localStorage (Frontend doesn't call API on load)
    await page.addInitScript(() => {
        window.localStorage.setItem(
            'monopass_session',
            JSON.stringify({
                token: 'mock-token-123',
                userId: 'test-user',
                role: 'SCANNER',
            })
        )
    })

    // Mock Session API just in case (though likely unused)
    await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: {
                    id: 'test-user',
                    name: 'Staff Member',
                    email: 'staff@monopass.club',
                    role: 'SCANNER',
                },
                expires: new Date(Date.now() + 86400000).toISOString(),
            }),
        })
    })

    // Mock Validate Endpoint
    await page.route('**/api/scanner/validate', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800)) // Simulate network delay
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                valid: true,
                ticket: {
                    id: 'ticket-123',
                    status: 'VALID',
                    attendeeName: 'Alex Riviera',
                    ticketType: 'VIP Access',
                    eventDate: '2025-10-24T22:00:00Z',
                    accessTime: '22:00 - 04:00',
                },
            }),
        })
    })

    // Mock Confirm Endpoint
    await page.route('**/api/scanner/confirm', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                confirmed: true,
                ticket: {
                    id: 'ticket-123',
                    status: 'SCANNED',
                    attendeeName: 'Alex Riviera',
                    ticketType: 'VIP Access',
                    eventDate: '2025-10-24T22:00:00Z',
                    accessTime: '22:00 - 04:00',
                },
            }),
        })
    })

    // 2. Grant Permissions
    await page.context().grantPermissions(['camera'])

    // 3. Navigate to Scanner Page
    await page.goto('http://localhost:5176/scanner', { waitUntil: 'networkidle' })

    // 4. Inject CSS to make video transparent so we can see the background animation
    await page.addStyleTag({
        content: `
      .scanner-stage__reader video {
        opacity: 0 !important;
      }
      .scanner-stage__viewport {
        background: transparent !important;
      }
      /* Ensure overlays are visible but beam is hidden during result */
      .scanner-stage__scan-beam {
        /* Keep beam visible initially */
      }
    `,
    })

    // 5. Inject the Animation HTML/CSS/JS (Background)
    // We use an iframe or absolute positioned div behind the scanner UI
    await page.evaluate(() => {
        const container = document.createElement('div')
        container.id = 'demo-background'
        container.style.position = 'fixed'
        container.style.top = '0'
        container.style.left = '0'
        container.style.width = '100%'
        container.style.height = '100%'
        container.style.zIndex = '-1' // Behind everything
        container.style.background = '#000'
        container.innerHTML = `
      <iframe 
        src="/scanner_video_demo.html" 
        style="width: 100%; height: 100%; border: none; object-fit: cover;"
      ></iframe>
    `
        document.body.appendChild(container)
    })

    // 6. Start Recording (Externally controlled via config, but we set up the timing here)
    // Wait for animation to be ready
    await page.waitForTimeout(1000)

    // Trigger animation start inside the iframe
    await page.evaluate(() => {
        const iframe = document.querySelector('#demo-background iframe') as HTMLIFrameElement
        if (iframe && iframe.contentWindow) {
            // Assuming scanner_video_demo.html has a startSequence function exposed or auto-starts
            // It auto-starts on load after 500ms in the current script.
            // We might want to reload it to sync perfectly.
            iframe.contentWindow.location.reload()
        }
    })

    // 7. Wait for "Scan" moment in animation
    // The animation logic in scanner_video_demo.html:
    // 0ms: Load
    // 500ms: Hand enters
    // 1800ms: Beam active
    // 2800ms: Validation result (in animation) -> We want REAL UI to take over here.

    // We want to trigger the real scan around 1800ms-2000ms when the beam "hits" the code.
    await page.waitForTimeout(2000)

    // 8. Trigger Real Scan
    await page.evaluate(() => {
        const event = new CustomEvent('pm:scanner:simulate', {
            detail: { token: 'valid-token-123' },
        })
        window.dispatchEvent(event)
    })

    // 9. Wait for Success Screen (Real UI)
    console.log('DEBUG: Current URL before assert:', page.url())
    console.log('DEBUG: Page Content:', await page.content())
    await expect(page.locator('.scanner-overlay--success')).toBeVisible({ timeout: 5000 })

    // 10. Hold for a few seconds to record the success state
    await page.waitForTimeout(3000)

    // 11. Save the video
    const video = page.video()
    if (video) {
        await video.saveAs('../landing/public/assets/videos/scanner-demo.webm')
    }
})
