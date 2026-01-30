import { reactive, computed, watch } from 'vue'
import { Sizes, type LabelTypeKey, labelTypeConfig, Templates } from '~/types/label'
import type { ImageSize } from '~/types/label-images'
import { printers } from '~/config/printers'
import type { LabelForm } from '~/types/label'

/**
 * Create a default LabelForm for a given type.
 * Use an explicit factory so the returned object matches the discriminated union shape.
 */
function createDefaultForm(type: LabelTypeKey): LabelForm {
  const base = {
    type,
    size: Sizes.Normal,
    qty: 1,
    description: '',
    date: new Date().toISOString().slice(0, 10),
    address: { name: '', lines: '', zip: '', city: '', country: '' },
    image: {
      key: 'none',
      size: 'm' as ImageSize
    },
    template: Templates.General
  }

  // If you have specific per-type differences, extend here.
  // The cast assures TS that this object conforms to LabelForm union.
  return base as unknown as LabelForm
}

export function useLabelForm() {
  const form = reactive<LabelForm & { printer?: string }>(
    Object.assign(createDefaultForm('food' as LabelTypeKey), { printer: printers[0]?.key })
  )

  /**
   * Return a computed ref for nested fields given a dot-path like "address.name".
   * Works for reading and writing nested properties safely.
   */
  function getFieldValue(path: string) {
    const keys = path.split('.').filter(Boolean) as string[]

    // Always return a computed of type string | number (no undefined)
    return computed<string | number>({
      get() {
        const val = keys.reduce<unknown>((acc, key) => {
          if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[key]
          }
          return undefined
        }, form as unknown)

        if (val === undefined || val === null) return ''
        if (typeof val === 'number') return val
        return String(val)
      },
      set(val: string | number) {
        if (keys.length === 0) return
        const last = keys[keys.length - 1] as string
        let parent = form as unknown as Record<string, unknown>
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i] as string
          const next = parent[k]
          if (typeof next !== 'object' || next === null) {
            parent[k] = {}
          }
          parent = parent[k] as Record<string, unknown>
        }
        parent[last] = val as unknown
      }
    })
  }

  watch(() => form.type, (type) => {
    const cfg = labelTypeConfig[type]
    if (!cfg.allowSizeChange && cfg.fixedSize) form.size = cfg.fixedSize
    form.template = cfg.template ? cfg.template : Templates.General
  })

  const maxQuantity = computed(() => labelTypeConfig[form.type].maxQty ?? 10)

  async function printLabel() {
    await $fetch('/api/print', { method: 'POST', body: form })
    // TODO: use toast instead of alert
    alert('Sent to printer!')
  }

  return { form, getFieldValue, maxQuantity, printLabel }
}
