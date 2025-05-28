import { encode } from './zpl-tools'
import sharp from 'sharp'
import { glob } from 'glob'
import { basename, extname, join } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

const SRC = 'public/logos'
const OUT = 'server/templates/converted-logos'
const HEIGHT = { normal: 70, compact: 40 }            // dots @203 dpi

async function toBuf(path: string, h: number) {
  const buf = extname(path) === '.png'
    ? readFileSync(path)
    : await sharp(path).resize({ height: h }).png().toBuffer()
  return sharp(buf).resize({ height: h }).png().toBuffer()
}

async function build() {
  const files = await glob(`${SRC}/*.{svg,png}`)
  const pick: Record<string,string> = {}

  for (const p of files) {
    const base = basename(p, extname(p)).toLowerCase()
    if (pick[base] && extname(pick[base]) === '.svg') continue // prefer SVG
    pick[base] = p
  }
  if (!Object.keys(pick).length) return console.log('No logos')

  rmSync(OUT, { recursive:true, force:true })
  mkdirSync(OUT, { recursive:true })

  const tmp = mkdtempSync(join(tmpdir(), 'logos-'))

  for (const [base, src] of Object.entries(pick)) {
    for (const [mode, h] of Object.entries(HEIGHT)) {
      const buf = await toBuf(src, h)
      const zpl   = await encode(buf, { method:'Z64', mimeType:'image/png' })
      writeFileSync(join(OUT, `${base}_${mode}.txt`), zpl)
    }
    console.log('✓', base)
  }
  rmSync(tmp, { recursive:true, force:true })
}
build().catch(e => (console.error(e), process.exit(1)))
