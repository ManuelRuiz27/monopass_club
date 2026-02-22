import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test, chromium } from '@playwright/test'

test('record manager operations desktop video', async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--hide-scrollbars', '--headless=new'],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: 'videos/',
      size: { width: 1280, height: 720 },
    },
  })

  const page = await context.newPage()

  const htmlPath = path.resolve('../landing/public/manager_ops_demo.html')
  await page.goto(`file://${htmlPath}`)
  await page.waitForTimeout(7600)

  await context.close()
  await browser.close()

  const webmOutput = path.resolve('../landing/public/assets/videos/manager-demo.webm')
  const mp4Output = path.resolve('../landing/public/assets/videos/manager-demo.mp4')
  const rawWebm = path.resolve('videos/manager-demo-raw.webm')

  const videoFiles = fs
    .readdirSync('videos/')
    .filter((file) => file.endsWith('.webm'))
    .map((file) => ({ name: file, mtime: fs.statSync(path.join('videos/', file)).mtime.getTime() }))
    .sort((a, b) => b.mtime - a.mtime)

  const latest = videoFiles[0]
  if (!latest) {
    throw new Error('No se genero ningun video webm para manager ops')
  }

  fs.mkdirSync(path.dirname(webmOutput), { recursive: true })
  fs.copyFileSync(path.join('videos/', latest.name), rawWebm)

  try {
    execSync(`ffmpeg -y -i "${rawWebm}" -c:v libvpx -crf 30 -b:v 0 -an "${webmOutput}"`, { stdio: 'ignore' })
    execSync(`ffmpeg -y -i "${rawWebm}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4Output}"`, {
      stdio: 'ignore',
    })
  } catch {
    fs.copyFileSync(rawWebm, webmOutput)
  }
})
