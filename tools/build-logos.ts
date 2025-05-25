import { encode } from '@replytechnologies/zpl-image-convert'
import sharp from 'sharp'
import { glob } from 'glob'
import { basename, extname, join } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'

async function rasterise (src: string): Promise<Buffer> {
  // If it's already a PNG we just read it
  if (extname(src).toLowerCase() === '.png') return readFileSync(src)
  // Otherwise convert SVG → 150-px-high PNG
  return sharp(src).resize({ height: 50 }).png().toBuffer()
}

async function build () {
  const files = await glob('public/logos/*.{svg,png}')
  if (!files.length) {
    console.log('No SVG or PNG files found in public/logos/. Done.')
    return
  }

  const outDir = 'server/templates/converted-logos'
  mkdirSync(outDir, { recursive: true })

  for (const inPath of files) {
    const name = basename(inPath, extname(inPath))          // food, storage …
    const pngBuf = await rasterise(inPath)

    /*  FIX: tell the lib we're giving it an image/png buffer  */
    const z64 = await encode(pngBuf, {
      method   : 'Z64',
      mimeType : 'image/png'
    })

    const zplBlock =
      `^FO30,30\n${z64}\n^FS`                               // ready for {{image}}
    const target = join(outDir, `${name}.txt`)
    writeFileSync(target, zplBlock)
    console.log('✓', name, '→', target)
  }
}

build().catch(err => { console.error(err); process.exit(1) })
