import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const svgPath = path.resolve('public/pwa-icon.svg')
const svgContent = fs.readFileSync(svgPath, 'utf8')

function renderSvgToPng(size, outputPath) {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`

  const tempHtml = path.resolve(`temp_${size}.html`)
  fs.writeFileSync(tempHtml, htmlContent, 'utf8')

  const tempUserDataDir = path.resolve(`temp_chrome_profile_${size}`)

  try {
    execFileSync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--user-data-dir=${tempUserDataDir}`,
      `--window-size=${size},${size}`,
      `--screenshot=${outputPath}`,
      `file://${tempHtml.replace(/\\/g, '/')}`,
    ])
    console.log(`Successfully generated ${outputPath} (${size}x${size})`)
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml)
    if (fs.existsSync(tempUserDataDir)) {
      try {
        fs.rmSync(tempUserDataDir, { recursive: true, force: true })
      } catch (e) {
        // ignore
      }
    }
  }
}

renderSvgToPng(192, path.resolve('public/pwa-192x192.png'))
renderSvgToPng(512, path.resolve('public/pwa-512x512.png'))
renderSvgToPng(48, path.resolve('public/favicon-48x48.png'))
renderSvgToPng(32, path.resolve('public/favicon-32x32.png'))
renderSvgToPng(16, path.resolve('public/favicon-16x16.png'))
console.log('All icons generated!')
