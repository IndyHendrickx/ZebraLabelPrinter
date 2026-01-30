import { readBody } from 'h3'
import { $fetch } from 'ofetch'
import type { LabelForm } from '~/types/label'
import { generateZpl } from './generate.zpl'
import { ready } from 'zpl-renderer-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as Record<string, unknown>
  const form = body as unknown as LabelForm
  const useExternalAPI = Boolean(body['useExternalAPI'])

  // IMPORTANT: preview should not throw on partial/invalid data -> skip strict validation
  const zpl = generateZpl(form, { skipValidation: true })

  if (useExternalAPI) {
    return await labelaryAPI(zpl)
  }

  const { api } = await ready
  const zplImage = await api.zplToBase64Async(zpl, 59.94, 39.88, 8)
  return 'data:image/png;base64,' + zplImage
})

async function labelaryAPI(zpl: string): Promise<string> {
  const res = await $fetch.raw(
    'https://api.labelary.com/v1/printers/8dpmm/labels/2.36x1.57/0/',
    {
      method: 'POST',
      body: zpl + '\n',
      responseType: 'arrayBuffer',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'image/png'
      }
    }
  )
  const png = res._data as ArrayBuffer
  return 'data:image/png;base64,' + Buffer.from(png).toString('base64')
}
