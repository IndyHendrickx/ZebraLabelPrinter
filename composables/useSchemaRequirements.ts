// composables/useSchemaRequirements.ts
import { type ZodTypeAny } from 'zod'
import { labelSchema } from '~/types/label'
import type { LabelTypeKey } from '~/types/label'

/**
 * Inspect Zod schema internals to determine which fields are required.
 * - Looks for ZodString checks with kind==='min' && value > 0 (or .nonempty).
 * - Returns dotted keys for nested objects (e.g. "address.name").
 *
 * Note: uses Zod internals via `_def` — stable for current Zod versions, with defensive checks.
 */

function isStringRequired(zodType: ZodTypeAny | undefined): boolean {
    if (!zodType || !(zodType as any)._def) return false
    const def = (zodType as any)._def
    if (def.typeName !== 'ZodString') return false
    const checks = def.checks as Array<{ kind?: string; value?: number }> | undefined
    if (!checks) return false
    return checks.some(c => c.kind === 'min' && Number(c.value ?? 0) > 0)
}

function shapeOf(zodObj: any): Record<string, ZodTypeAny> | undefined {
    // Zod stores shape in several internal forms depending on version; try common accessors
    if (!zodObj || !(zodObj as any)._def) return undefined
    const def = (zodObj as any)._def
    if (typeof def.shape === 'function') return def.shape()
    if (def.shape) return def.shape
    return undefined
}

/**
 * Return an array of dotted keys that are "required" (string min>0) for the discriminated type.
 */
export function getRequiredKeysForType(type: LabelTypeKey): string[] {
    const unionDef = (labelSchema as any)._def
    const options = unionDef && Array.isArray(unionDef.options) ? unionDef.options as any[] : []
    const opt = options.find(o => {
        const s = shapeOf(o)
        if (!s) return false
        const typeSchema = s['type']
        if (!typeSchema || !(typeSchema as any)._def) return false
        return (typeSchema as any)._def.value === type
    })
    if (!opt) return []

    const shape = shapeOf(opt)
    if (!shape) return []

    const requiredKeys: string[] = []

    for (const [key, zType] of Object.entries(shape)) {
        if (key === 'type') continue
        // nested object case (address)
        const nested = (zType as any)?._def?.typeName === 'ZodObject' ? shapeOf(zType) : undefined
        if (nested) {
            for (const [subKey, subType] of Object.entries(nested)) {
                if (isStringRequired(subType as ZodTypeAny)) requiredKeys.push(`${key}.${subKey}`)
            }
        } else {
            if (isStringRequired(zType as ZodTypeAny)) requiredKeys.push(key)
        }
    }

    return requiredKeys
}

export function isFieldRequiredForType(type: LabelTypeKey, fieldKey: string): boolean {
    const required = getRequiredKeysForType(type)
    return required.includes(fieldKey)
}