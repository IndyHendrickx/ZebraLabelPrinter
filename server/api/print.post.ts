import net from 'node:net'
import { readBody } from 'h3'
import { generateZpl } from './generate.zpl'
import { getPrinter } from '~/config/printers'
import type { LabelForm } from '~/types/label'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const body = await readBody(event) as Record<string, unknown>
  const printerKey = typeof body['printer'] === 'string' ? body['printer'] : undefined
  const printer = printerKey ? getPrinter(printerKey) : undefined

  const form = (body as unknown) as LabelForm
  const zpl = generateZpl(form)

  const host = printer?.host ?? cfg.printerHost
  const port = printer?.port ?? 9100

  await new Promise<void>((resolve, reject) => {
    const sock = net.createConnection({ host, port }, () => {
      sock.write(zpl, () => sock.end())
    })
    sock.on('close', resolve)
    sock.on('error', reject)
  })
  return { ok: true }
})
