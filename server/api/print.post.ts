import net from 'node:net'
import { readBody } from 'h3'
import { generateZpl } from './generateZpl'
import type { LabelForm } from '~/types/label'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const form = await readBody<LabelForm>(event)
  const zpl = generateZpl(form)
  await new Promise<void>((resolve, reject) => {
    const sock = net.createConnection({ host: cfg.printerHost, port: 9100 }, () => {
      sock.write(zpl!, () => sock.end())
    })
    sock.on('close', resolve)
    sock.on('error', reject)
  })
  return { ok: true }
})
