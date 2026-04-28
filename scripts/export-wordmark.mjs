import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fjalla+One&family=DM+Serif+Display:ital@1&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: transparent; }
    .wordmark {
      display: inline-flex;
      align-items: baseline;
      padding: 24px 40px;
      white-space: nowrap;
    }
    .job {
      font-family: 'Fjalla One', sans-serif;
      font-size: 64px;
      color: #0A0B0E;
      line-height: 1;
      letter-spacing: -0.01em;
    }
    .fit {
      font-family: 'DM Serif Display', serif;
      font-style: italic;
      font-weight: 400;
      font-size: 70px;
      color: #C01414;
      line-height: 1;
    }
  </style>
</head>
<body>
  <div class="wordmark">
    <span class="job">Job</span><span class="fit">fit</span>
  </div>
</body>
</html>`

async function capture(scale) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 200, deviceScaleFactor: scale })
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const el = await page.$('.wordmark')
  const png = await el.screenshot({ omitBackground: true })
  await browser.close()
  return png
}

for (const [suffix, scale] of [['', 1], ['@2x', 2]]) {
  const png = await capture(scale)
  const dest1 = join(root, 'website', 'public', `wordmark${suffix}.png`)
  const dest2 = join(root, 'public', `wordmark${suffix}.png`)
  writeFileSync(dest1, png)
  writeFileSync(dest2, png)
  console.log(`✓ wordmark${suffix}.png`)
}
