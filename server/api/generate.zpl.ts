import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { labelSchema, type LabelForm } from '~/types/label'

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date)
    )
}

function isoToDDMMYYYY(isoOrDate: string | Date | undefined): string {
    if (!isoOrDate) return ''
    let date: Date
    if (isoOrDate instanceof Date) date = isoOrDate
    else date = new Date(String(isoOrDate))
    if (Number.isNaN(date.getTime())) return ''
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = String(date.getFullYear())
    return `${d}/${m}/${y}`
}

function stringifyValue(v: unknown): string {
    if (v instanceof Date) return isoToDDMMYYYY(v)
    if (Array.isArray(v)) return v.map(i => stringifyValue(i)).join(', ')
    if (v === null || v === undefined) return ''
    return String(v)
}

function flattenKeys(obj: unknown, prefix = ''): Record<string, string> {
    const res: Record<string, string> = {}
    if (!isPlainObject(obj)) {
        const key = prefix || 'value'
        res[key] = stringifyValue(obj)
        return res
    }

    for (const [key, val] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (isPlainObject(val)) {
            Object.assign(res, flattenKeys(val, newKey))
        } else {
            res[newKey] = stringifyValue(val)
        }
    }
    return res
}

/**
 * Generate ZPL from a form.
 * opts.skipValidation = true: do not throw on invalid input — used for preview.
 */
export function generateZpl(form: unknown, opts?: { skipValidation?: boolean }): string {
    if (!opts?.skipValidation) {
        const parsed = labelSchema.safeParse(form)
        if (!parsed.success) {
            console.log(form)
            const errors = parsed.error.flatten().fieldErrors
            throw new Error(JSON.stringify(errors))
        }
        // keep parsed.data as-is (date is a Date)
        const data: LabelForm = parsed.data
        return buildZplFromData(data)
    }

    // skip validation path — coerce form to a safe shape with sensible defaults
    const raw = (isPlainObject(form) ? (form as Record<string, unknown>) : {})
    const data = {
        type: String(raw.type ?? 'food'),
        template: String(raw.template ?? 'general'),
        size: String(raw.size ?? 'normal'),
        date: raw.date ? new Date(String(raw.date)) : new Date(),
        qty: Number(raw.qty ?? 1),
        image: {
            key: String((raw.image && typeof raw.image === 'object' && (raw.image as any).key) ?? 'none'),
            size: String((raw.image && typeof raw.image === 'object' && (raw.image as any).size) ?? 'm')
        },
        description: raw.description ?? '',
        address: raw.address ?? {}
    } as unknown as LabelForm

    return buildZplFromData(data)
}

function buildZplFromData(data: LabelForm) {
    const templateFile = join('server/templates', `${data.template}-${data.size}.zpl`)
    let zpl: string
    try {
        zpl = readFileSync(templateFile, 'utf-8')
    } catch (err) {
        throw new Error(`Could not read template file: ${templateFile}`)
    }

    const imagePlaceholderRegex = /\{\{image\}\}/g
    if (data.image?.key && data.image.key !== 'none') {
        const imageFile = join('server/templates/converted-logos', `${data.image.key}_${String(data.image.size)}.zpl`)
        try {
            const imageTxt = readFileSync(imageFile, 'utf-8')
            zpl = zpl.replace(imagePlaceholderRegex, imageTxt)
        } catch {
            zpl = zpl.replace(imagePlaceholderRegex, '')
        }
    } else {
        zpl = zpl.replace(imagePlaceholderRegex, '')
    }

    const flatData = flattenKeys(data)
    for (const [key, value] of Object.entries(flatData)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        zpl = zpl.replace(regex, value)
    }
    return zpl
}