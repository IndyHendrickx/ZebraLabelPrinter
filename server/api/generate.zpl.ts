import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { labelSchema, type LabelForm } from '~/types/label'

/**
 * Type guard for plain objects (excludes arrays and null).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Flatten nested object keys into dot-notation mapping.
 * Example: { address: { name: "John" } } -> { "address.name": "John" }
 *
 * - Accepts any unknown input and safely guards for plain objects.
 * - Converts non-object values to string.
 */
function flattenKeys(obj: unknown, prefix = ''): Record<string, string> {
    const res: Record<string, string> = {}

    if (!isPlainObject(obj)) {
        // Non-object root becomes a single key (useful for primitives/arrays)
        const key = prefix || 'value'
        res[key] = String(obj ?? '')
        return res
    }

    for (const [key, val] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (isPlainObject(val)) {
            Object.assign(res, flattenKeys(val, newKey))
        } else if (Array.isArray(val)) {
            // Preserve array as a comma-separated string (explicit and safe)
            res[newKey] = val.map((v) => String(v ?? '')).join(', ')
        } else {
            res[newKey] = String(val ?? '')
        }
    }

    return res
}

/**
 * Convert ISO date string (YYYY-MM-DD) to DD/MM/YYYY.
 * Assumes a simple ISO date; returns empty string for falsy input.
 */
function isoToDDMMYYYY(iso: string | undefined): string {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d?.padStart(2, '0')}/${m?.padStart(2, '0')}/${y}`
}

/**
 * Generate ZPL string from a validated LabelForm.
 * - Validates input against labelSchema.
 * - Loads template and optional image ZPL blobs.
 * - Replaces placeholders using flattened data keys.
 */
export function generateZpl(form: LabelForm): string {
    const parsed = labelSchema.safeParse(form)
    if (!parsed.success) {
        // Log original input to help debugging, then throw structured errors.
        console.log(form)
        const errors = parsed.error.flatten().fieldErrors
        throw new Error(JSON.stringify(errors))
    }

    // Work on a shallow copy to avoid mutating Zod output unexpectedly.
    const data: LabelForm = { ...parsed.data, date: isoToDDMMYYYY(parsed.data.date) }

    const templateFile = join('server/templates', `${data.template}-${data.size}.zpl`)
    let zpl: string
    try {
        zpl = readFileSync(templateFile, 'utf-8')
    } catch (err) {
        throw new Error(`Could not read template file: ${templateFile}`)
    }

    // Image placeholder handling: try to load converted image ZPL, otherwise empty.
    const imagePlaceholderRegex = /\{\{image\}\}/g
    if (data.image.key && data.image.key !== 'none') {
        const imageFile = join(
            'server/templates/converted-logos',
            `${data.image.key}_${String(data.image.size)}.zpl`
        )
        try {
            const imageTxt = readFileSync(imageFile, 'utf-8')
            zpl = zpl.replace(imagePlaceholderRegex, imageTxt)
        } catch {
            zpl = zpl.replace(imagePlaceholderRegex, '')
        }
    } else {
        zpl = zpl.replace(imagePlaceholderRegex, '')
    }

    // Replace all placeholders using flattened keys for nested properties.
    const flatData = flattenKeys(data)
    for (const [key, value] of Object.entries(flatData)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        zpl = zpl.replace(regex, value)
    }

    return zpl
}