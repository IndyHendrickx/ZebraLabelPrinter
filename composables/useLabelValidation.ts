import { computed } from 'vue'
import { labelSchema, type LabelForm } from '~/types/label'

/**
 * Provide reactive validation for a LabelForm.
 * - Uses Zod schema safeParse to avoid throwing.
 * - Returns { valid, errors } where errors is a flattened fieldErrors map.
 */
export function useLabelValidation(form: LabelForm & { printer?: string }) {
  const validation = computed<{
    valid: boolean
    errors: Record<string, string[] | undefined>
  }>(() => {
    const result = labelSchema.safeParse(form)
    return {
      valid: result.success,
      errors: result.success ? {} : (result.error.flatten().fieldErrors as Record<string, string[] | undefined>)
    }
  })

  return { validation }
}
