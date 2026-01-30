import { computed, type ComputedRef } from 'vue'
import { labelSchema, type LabelForm } from '~/types/label'

/**
 * Reactive validation helpers for a LabelForm.
 * Returns:
 * - validation: computed object `{ valid, errors }`
 * - isValid(): boolean helper
 * - getErrors(key?): errors for a field or undefined
 */
export function useLabelValidation(
  form: LabelForm & { printer?: string }
): {
  validation: ComputedRef<{ valid: boolean; errors: Record<string, string[] | undefined> }>
  isValid: () => boolean
  getErrors: (key?: string) => string[] | undefined
} {
  const validation = computed(() => {
    const result = labelSchema.safeParse(form)
    return {
      valid: result.success,
      errors: result.success ? {} : (result.error.flatten().fieldErrors as Record<string, string[] | undefined>)
    }
  })

  function isValid() {
    return validation.value.valid
  }

  function getErrors(key?: string) {
    if (!key) return undefined
    return validation.value.errors[key]
  }

  return { validation, isValid, getErrors }
}
