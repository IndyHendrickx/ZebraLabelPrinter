import { readBody } from 'h3'
import { $fetch } from 'ofetch'
import { LabelForm } from '~/types/label'
import { generateZpl } from './generateZpl'

export default defineEventHandler(async (event) => {
  const form = await readBody<LabelForm>(event)
  const zpl = generateZpl(form)
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
})
