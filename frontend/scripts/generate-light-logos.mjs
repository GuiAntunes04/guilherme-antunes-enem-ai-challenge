import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const brandDir = path.join(__dirname, '../public/brand')

const pairs = [
  ['logo-wordmark.png', 'logo-wordmark-light.png'],
  ['logo-mark.png', 'logo-mark-light.png'],
]

for (const [inputName, outputName] of pairs) {
  const inputPath = path.join(brandDir, inputName)
  const outputPath = path.join(brandDir, outputName)

  await sharp(inputPath)
    .negate({ alpha: false })
    .png()
    .toFile(outputPath)

  console.log(`Wrote ${outputName}`)
}
