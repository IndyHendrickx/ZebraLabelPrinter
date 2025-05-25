import { readBody, createError } from 'h3'
import net from 'node:net'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

type Payload = {
  type: 'food' | 'storage' | 'reminder' | 'unknown'
  size: 'normal' | 'compact'
  date?: string
  item: string
  qty: number
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const body = await readBody<Payload>(event)

  // 1  validation
  if (body.size === 'compact' && body.qty % 2)
    throw createError({ statusCode: 400, statusMessage: 'Compact labels → multiples of 2' })
  if (body.size === 'normal' && body.qty < 1)
    throw createError({ statusCode: 400, statusMessage: 'Normal labels → minimum 1' })
  if (body.size === 'compact' && body.qty > 10)
    throw createError({ statusCode: 400, statusMessage: 'Compact labels → max 10' })
  if (body.size === 'normal' && body.qty > 10)
    throw createError({ statusCode: 400, statusMessage: 'Normal labels → max 10' })

  // 2  fill template
  const file = join('server/templates', `${body.size}.zpl`)
  let zpl = await fs.readFile(file, 'utf8')
  const logoTxt = await fs.readFile(
  `server/templates/converted-logos/${body.type}.txt`, 'utf8')
  
  const asciiItem = body.item.replace(/[^ -~]/g, '').toUpperCase()
  const labelDate = body.date || new Date().toISOString().slice(0, 10)
  zpl = zpl
    .replace('{{date}}', labelDate)
    .replace('{{item}}', asciiItem)
    .replace('{{qty}}', String(body.qty))
    .replace('{{image}}', logoTxt)

  // Check for preview - no print needed!
  if (getQuery(event).preview === '1') {
      return { zpl }                          // client gets JSON {zpl: "…"}
  }

  // 3  send to printer on port 9100
  await new Promise<void>((resolve, reject) => {
    const sock = net.createConnection({ host: cfg.printerHost, port: 9100 }, () => {
      sock.write(zpl, () => sock.end())
    })
    sock.on('close', resolve)
    sock.on('error', reject)
  })

  return { ok: true }
})
