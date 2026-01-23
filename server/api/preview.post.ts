import { readBody } from 'h3'
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event) => {
  const { zpl } = await readBody<{ zpl: string }>(event)

  const png = await $fetch<ArrayBuffer>(
    'https://api.labelary.com/v1/printers/8dpmm/labels/2.36x1.57/0/',
    {
      method       : 'POST',
      body         : zpl + '\n',
      responseType : 'arrayBuffer',
      headers      : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept'      : 'image/png'
      }
    }
  )

  return 'data:image/png;base64,' + Buffer.from(png).toString('base64')
})
