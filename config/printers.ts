export type Printer = {
  key: string
  name: string
  host: string
  port: number
}

/**
 * Add your printers here. This file is imported from both client and server code.
 */
export const printers: Printer[] = [
  { key: 'office', name: 'Office Zebra', host: '10.111.111.91', port: 9100 }
]

export function getPrinter(key: string) {
  return printers.find(p => p.key === key)
}