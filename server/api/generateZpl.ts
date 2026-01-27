import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { labelSchema, type LabelForm } from '~/types/label'

/**
 * Flatten nested object keys
 * E.g., { address: { name: "John" } } -> { "address.name": "John" }
 */
function flattenKeys(obj: any, prefix = ''): Record<string, string> {
    const res: Record<string, string> = {}
    for (const key in obj) {
        const val = obj[key]
        const newKey = prefix ? `${prefix}.${key}` : key
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(res, flattenKeys(val, newKey))
        } else {
            res[newKey] = String(val ?? '')
        }
    }
    return res
}

/**
 * Convert iso date to DD/MM/YYYY
 */
function isoToDDMMYYYY(iso: string) {
    const [y, m, d] = iso.split('-')
    return `${d?.padStart(2, '0')}/${m?.padStart(2, '0')}/${y}`
}

/**
 * Generate ZPL string from a label form
 */
export function generateZpl(form: LabelForm): string {
    const parsed = labelSchema.safeParse(form)
    if (!parsed.success) {
        console.log(form)
        const errors = parsed.error.flatten().fieldErrors
        throw new Error(JSON.stringify(errors))
    }

    const data = parsed.data
    data.date = isoToDDMMYYYY(data.date)
    const templateFile = join('server/templates', `${data.template}-${data.size}.zpl`)
    let zpl: string
    try {
        zpl = readFileSync(templateFile, 'utf-8')
    } catch (err) {
        throw new Error(`Could not read template file: ${templateFile}`)
    }

    if (data.image.key && data.image.key !== 'none') {
        const imageFile = join(
            'server/templates/converted-logos',
            `${data.image.key}_${String(data.image.size)}.zpl`
        )
        try {
            const imageTxt = readFileSync(imageFile, 'utf-8')
            zpl = zpl.replace('{{image}}', imageTxt)
        } catch {
            zpl = zpl.replace('{{image}}', '')
        }
    } else {
        zpl = zpl.replace('{{image}}', '')
    }

    const flatData = flattenKeys(data)
    for (const key in flatData) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        zpl = zpl.replace(regex, flatData[key] as string)
    }

    return zpl
}
