import { test, chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test('record scanner animation', async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--hide-scrollbars', '--headless=new'],
  })

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: {
      dir: 'videos/',
      size: { width: 390, height: 844 },
    },
  })

  const page = await context.newPage()

  const htmlPath = path.resolve('../landing/public/scanner_anim.html')
  await page.goto(`file://${htmlPath}`)

  await page.waitForTimeout(17_000)

  await context.close()
  await browser.close()

  const videoFiles = fs.readdirSync('videos/').filter((file) => file.endsWith('.webm'))
  const latestVideo = videoFiles
    .map((file) => ({ name: file, time: fs.statSync(path.join('videos/', file)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time)[0]

  if (!latestVideo) {
    throw new Error('No se genero ningun video webm de scanner')
  }

  const srcPath = path.join('videos/', latestVideo.name)
  const destPath = path.resolve('../landing/public/assets/videos/scanner-demo.webm')

  if (!fs.existsSync(path.dirname(destPath))) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
  }

  fs.copyFileSync(srcPath, destPath)
  console.log(`Saved to ${destPath}`)
})
