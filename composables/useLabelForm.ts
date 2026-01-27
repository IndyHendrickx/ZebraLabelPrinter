import { reactive, computed, watch } from 'vue'
import { Sizes, type LabelTypeKey, labelTypeConfig, Templates } from '~/types/label'
import type { ImageSize } from '~/types/label-images'

export function useLabelForm() {
  const form = reactive({
    type: 'food' as LabelTypeKey,
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
  })

  function getFieldValue(path: string) {
    return computed({
      get() { return path.split('.').reduce((o, k) => o[k], form as any) },
      set(val: any) { const keys = path.split('.'); const last = keys.pop()!; const obj = keys.reduce((o, k) => o[k], form as any); obj[last] = val }
    })
  }

  watch(() => form.type, type => {
    const cfg = labelTypeConfig[type]
    if (!cfg.allowSizeChange && cfg.fixedSize) form.size = cfg.fixedSize
    form.template = cfg.template ? cfg.template : Templates.General
  })

  const maxQuantity = computed(() =>
    labelTypeConfig[form.type].maxQty ?? 10
  )

  async function printLabel() {
    await $fetch('/api/print', { method: 'POST', body: form });
    alert('Sent to printer!')
  }

  return { form, getFieldValue, maxQuantity, printLabel }
}
