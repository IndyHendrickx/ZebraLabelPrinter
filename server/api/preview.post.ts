import { readBody } from 'h3'
import { $fetch } from 'ofetch'
import { LabelForm } from '~/types/label'
import { generateZpl } from './generateZpl'
import { ready } from "zpl-renderer-js"

interface UseAPI {
  useExternalAPI: boolean
}

export default defineEventHandler(async (event) => {
  const form = await readBody<LabelForm>(event)
  const labelary = await readBody<UseAPI>(event)
  const zpl = generateZpl(form)

  // This should only be used if our module isnt working as expected
  if (labelary.useExternalAPI) {
    return await labelaryAPI(zpl)
  }
  const { api } = await ready;
  const zplImage = await api.zplToBase64Async(zpl, 59.94, 39.88, 8);
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
