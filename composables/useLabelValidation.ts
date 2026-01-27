import { computed } from 'vue'
import { labelSchema } from '~/types/label'

export function useLabelValidation(form: any) {
  const validation = computed(() => {
    const result = labelSchema.safeParse(form)
    return { valid: result.success, errors: result.success ? {} : result.error.flatten().fieldErrors }
  })
  return { validation }
}
