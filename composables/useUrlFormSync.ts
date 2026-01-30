import { watch, onMounted, type WritableComputedRef } from 'vue'
import { useRoute, useRouter } from '#imports'

type FieldRef = WritableComputedRef<string | number | Date | ''>

function dateToIso(d: unknown): string {
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return ''
}

function stringifyForUrl(v: unknown): string {
    if (v instanceof Date) return dateToIso(v)
    if (v === null || v === undefined) return ''
    if (Array.isArray(v)) return v.map(i => stringifyForUrl(i)).join(',')
    return String(v)
}

function flattenForUrl(obj: unknown, prefix = ''): Record<string, string> {
    const res: Record<string, string> = {}
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj) || obj instanceof Date) {
        const key = prefix || 'value'
        res[key] = stringifyForUrl(obj)
        return res
    }
    for (const [k, val] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${k}` : k
        Object.assign(res, flattenForUrl((val as unknown), newKey))
    }
    return res
}

/**
 * Sync a reactive `form` with the URL query.
 * - On mount: read query keys and write to form via `getFieldValue(key).value`.
 * - After changes: update URL with flattened form values (ISO date for dates).
 *
 * Usage: call `useUrlFormSync(form, getFieldValue)` from your page setup.
 */
export function useUrlFormSync(
    form: Record<string, unknown>,
    getFieldValue: (path: string) => FieldRef,
    options?: { debounceMs?: number }
) {
    const route = useRoute()
    const router = useRouter()
    const debounceMs = options?.debounceMs ?? 600
    let timer: ReturnType<typeof setTimeout> | null = null

    onMounted(() => {
        const q = route.query || {}
        for (const [k, raw] of Object.entries(q)) {
            // Normalize the raw query value to a string (never undefined)
            const val = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '')

            let fieldRef: FieldRef | undefined
            try {
                fieldRef = getFieldValue(k)
            } catch {
                // unknown path -> skip
                continue
            }

            try {
                const cur = fieldRef?.value

                if (cur instanceof Date) {
                    if (val !== '') {
                        const d = new Date(val)
                        if (!Number.isNaN(d.getTime())) fieldRef.value = d
                    }
                } else if (typeof cur === 'number') {
                    if (val !== '') {
                        const n = Number(val)
                        if (!Number.isNaN(n)) fieldRef.value = n
                    }
                } else {
                    // treat as string (including empty)
                    fieldRef.value = val as unknown as string
                }
            } catch {
                // ignore write errors
            }
        }
    })

    watch(
        () => form,
        (curr) => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                try {
                    const flat = flattenForUrl(curr)
                    // remove empty values to keep URL tidy
                    const cleaned: Record<string, string> = {}
                    for (const [k, v] of Object.entries(flat)) if (v !== '') cleaned[k] = v
                    router.replace({ query: cleaned }).catch(() => { })
                } catch {
                    // swallow routing errors
                }
            }, debounceMs)
        },
        { deep: true }
    )
}