import { test, chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test('record scanner animation', async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--hide-scrollbars', '--headless=new'],
    })

    // Set viewport to standard mobile size
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        recordVideo: {
            dir: 'videos/',
            size: { width: 390, height: 844 },
        },
    })

    const page = await context.newPage()

    // Load the animation file
    const htmlPath = path.resolve('../landing/public/scanner_video_demo.html')
    await page.goto(`file://${htmlPath}`)

    // Animation timing: 
    // Start: +0.5s
    // Ticket Enter: +0.6s -> duration ~1s
    // Laser: +1.4s
    // Result: +3.0s -> fade/scale in
    // Total ~4-5s should be enough
    await page.waitForTimeout(5000)

    await context.close()
    await browser.close()

    // Find the generated video
    const videoFiles = fs.readdirSync('videos/').filter((file) => file.endsWith('.webm'))
    const latestVideo = videoFiles
        .map((file) => ({ name: file, time: fs.statSync(path.join('videos/', file)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time)[0]

    if (!latestVideo) {
        throw new Error('No se genero ningun video webm de Scanner')
    }

    const srcPath = path.join('videos/', latestVideo.name)
    // Overwrite the existing scanner-demo.webm
    const destPath = path.resolve('../landing/public/assets/videos/scanner-demo.webm')

    if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
    }

    // Ensure retry/copy works
    try {
        fs.copyFileSync(srcPath, destPath)
        console.log(`Saved scanner video to ${destPath}`)
    } catch (err) {
        console.error('Error saving video:', err)
    }
})
