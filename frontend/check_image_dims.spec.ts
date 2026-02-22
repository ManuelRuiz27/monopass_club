import { test } from '@playwright/test';
import path from 'path';

test('check image dimensions', async ({ page }) => {
    const images = [
        '../landing/public/assets/screenshots/scanner-home.png',
        '../landing/public/assets/screenshots/scanner-validado.png',
        '../landing/public/assets/screenshots/staff-scanner-dashboard.png',
        '../landing/public/assets/screenshots/anim/scanner-video-frame-01-home.png',
        '../landing/public/assets/screenshots/manager-dashboard.png',
        '../landing/public/assets/screenshots/rp-form.png',
    ];

    for (const imgPath of images) {
        const fullPath = path.resolve(imgPath);
        const size = await page.evaluate(async (p) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = () => resolve({ width: 0, height: 0 }); // handle error
                img.src = 'file:///' + p.replace(/\\/g, '/');
            });
        }, fullPath);
        console.log(`${imgPath}:`, size);
    }
});
