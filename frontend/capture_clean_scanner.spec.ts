import { test } from '@playwright/test';

test('capture clean scanner scenes', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes timeout to be super safe

  // Forward browser console logs to stdout
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', exception => console.log('BROWSER EXCEPTION:', exception));

  await page.addInitScript(() => {
    const session = {
      token: 'mock-token-scanner',
      userId: 'scanner-1',
      role: 'SCANNER',
    }
    localStorage.setItem('monopass_session', JSON.stringify(session))

    // Mock Camera & Permissions to prevent 'systemIssue' blocking scan
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: async () => new MediaStream(),
        enumerateDevices: async () => [{ kind: 'videoinput', deviceId: 'mock-cam', label: 'Mock Camera' }],
      },
    });
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: async () => ({ state: 'granted' }),
      },
    });
  })

  // Mock API 
  await page.route('**/scan/validate', async route => {
    const { qrToken } = route.request().postDataJSON();
    console.log('API MOCK: Validating token:', qrToken);
    if (qrToken === 'VALID-TOKEN') {
      await route.fulfill({ json: { valid: true, ticket: { status: 'PAID', id: 't1', event: { name: 'Party' } } } });
    } else if (qrToken === 'USED-TOKEN') {
      await route.fulfill({ json: { valid: false, reason: 'ALREADY_SCANNED', ticket: { status: 'SCANNED' } } });
    } else if (qrToken === 'FAKE-TOKEN') {
      await route.fulfill({ json: { valid: false, reason: 'INVALID_TOKEN' } });
    } else if (qrToken === 'NOTE-TOKEN') {
      await route.fulfill({ json: { valid: true, ticket: { status: 'PAID', note: 'VIP Guest', id: 't4' } } });
    } else {
      await route.fulfill({ status: 400 });
    }
  });

  await page.route('**/scan/confirm', async route => {
    await route.fulfill({ json: { confirmed: true, ticket: { status: 'SCANNED' } } });
  });

  await page.setViewportSize({ width: 390, height: 844 });

  const TRANSPARENT_CSS = `
      body { margin: 0; padding: 0; background: transparent !important; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; }
      #root { width: 390px; height: 844px; overflow: hidden; background: transparent !important; position: relative; margin: 0; }
      .scanner-inline-issue { display: none !important; }
      [data-gsap-scan-header],
      [data-gsap-scan-ops],
      [data-gsap-scan-viewport],
      [data-gsap-scan-footer] {
        opacity: 1 !important;
        visibility: visible !important;
      }
      .scanner-stage { padding: 0 !important; background: transparent !important; }
      .scanner-stage__viewport {
        width: 390px !important;
        height: 844px !important;
        min-height: 844px !important;
        max-height: 844px !important;
        aspect-ratio: 390 / 844 !important;
        border-radius: 0 !important;
        background: transparent !important;
      }
      #reader { background-color: transparent !important; position: relative; }
      .scanner-stage__reader { background: transparent !important; }
      /* Ensure header/footer opaque */
      .scanner-stage__header, .scanner-stage__footer, .scanner-stage__sales {
          background: #fff; 
      }
  `;

  // 1. Home Frame
  console.log('Capturing Home Frame...');
  await page.goto('/scanner');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: TRANSPARENT_CSS });
  await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' });
  await page.waitForTimeout(1000);
  await page.locator('.scanner-stage__viewport').screenshot({
    path: '../landing/public/assets/screenshots/scanner-frame.png',
    omitBackground: true
  });
  await page.locator('.scanner-stage__viewport').screenshot({
    path: '../landing/public/assets/screenshots/scanner-mobile-home.png',
    omitBackground: false
  });

  // 2. Valid Card
  console.log('Capturing Valid Card...');
  await page.goto('/scanner');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: TRANSPARENT_CSS });
  await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' });
  await page.waitForTimeout(3000); // Wait for camera mock/init

  console.log('Dispatching VALID-TOKEN...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pm:scanner:simulate', { detail: { token: 'VALID-TOKEN' } })));

  try {
    await page.waitForSelector('.scanner-overlay__card', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500); // Animation buffer
    await page.locator('.scanner-stage__viewport').screenshot({
      path: '../landing/public/assets/screenshots/scanner-mobile-validado.png',
      omitBackground: false
    });
    await page.locator('.scanner-overlay__card').screenshot({
      path: '../landing/public/assets/screenshots/scanner-card-valid.png',
      omitBackground: true
    });
  } catch {
    console.error('Valid card not found capture timeout');
  }

  // 3. Rejected Card
  console.log('Capturing Rejected Card...');
  await page.goto('/scanner');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: TRANSPARENT_CSS });
  await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' });
  await page.waitForTimeout(3000); // Wait for camera mock/init

  console.log('Dispatching USED-TOKEN...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pm:scanner:simulate', { detail: { token: 'USED-TOKEN' } })));

  try {
    await page.waitForSelector('.scanner-overlay__card', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.locator('.scanner-stage__viewport').screenshot({
      path: '../landing/public/assets/screenshots/scanner-mobile-reutilizado.png',
      omitBackground: false
    });
    await page.locator('.scanner-overlay__card').screenshot({
      path: '../landing/public/assets/screenshots/scanner-card-rejected.png',
      omitBackground: true
    });
  } catch {
    console.error('Rejected card not found capture timeout');
  }

  // 4. Fraud Card
  console.log('Capturing Fraud Card...');
  await page.goto('/scanner');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: TRANSPARENT_CSS });
  await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' });
  await page.waitForTimeout(3000);

  console.log('Dispatching FAKE-TOKEN...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pm:scanner:simulate', { detail: { token: 'FAKE-TOKEN' } })));

  try {
    await page.waitForSelector('.scanner-overlay__card', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.locator('.scanner-overlay__card').screenshot({
      path: '../landing/public/assets/screenshots/scanner-card-fraud.png',
      omitBackground: true
    });
  } catch {
    console.error('Fraud card not found capture timeout');
  }

  // 5. Courtesy Card
  console.log('Capturing Courtesy Card...');
  await page.goto('/scanner');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({ content: TRANSPARENT_CSS });
  await page.waitForSelector('.scanner-stage__viewport', { state: 'visible' });
  await page.waitForTimeout(3000);

  console.log('Dispatching NOTE-TOKEN...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pm:scanner:simulate', { detail: { token: 'NOTE-TOKEN' } })));

  try {
    await page.waitForSelector('.scanner-overlay__card', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    await page.locator('.scanner-overlay__card').screenshot({
      path: '../landing/public/assets/screenshots/scanner-card-cortes.png',
      omitBackground: true
    });
  } catch {
    console.error('Courtesy card not found capture timeout');
  }
})
