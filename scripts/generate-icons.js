import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [16, 32, 64, 128, 256, 512, 1024]
const inputSvg = path.join(__dirname, '../assets/icon.svg')
const outputDir = path.join(__dirname, '../build')

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 生成 PNG 图标
async function generatePngs() {
  for (const size of sizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    console.log(`Generated icon-${size}x${size}.png`)
  }
  
  // 生成主图标
  await sharp(inputSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon.png'))
  console.log('Generated icon.png')
}

// 生成 ICO 文件 (Windows)
async function generateIco() {
  await sharp(inputSvg)
    .resize(256, 256)
    .toFile(path.join(outputDir, 'icon.ico'))
  console.log('Generated icon.ico')
}

// 生成 ICNS 文件 (macOS) - 需要使用 png2icns 工具
async function generateIcns() {
  // 首先生成所需的 PNG 文件
  const icnsSizes = [16, 32, 64, 128, 256, 512, 1024]
  const tempDir = path.join(outputDir, 'temp-icns')
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  
  for (const size of icnsSizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(tempDir, `icon_${size}x${size}.png`))
  }
  
  console.log('Generated PNG files for ICNS')
  console.log('Note: Use png2icns tool to create icon.icns from the generated PNG files')
}

// 运行生成
async function main() {
  try {
    console.log('Starting icon generation...')
    await generatePngs()
    await generateIco()
    await generateIcns()
    console.log('Icon generation completed!')
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

main()