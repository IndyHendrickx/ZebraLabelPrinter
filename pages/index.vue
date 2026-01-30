<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import LabelPreview from '~/components/LabelPreview.vue'
import FormField from '~/components/FormField.vue'
import ImagePicker from '~/components/ImagePicker.vue'
import PrinterSelect from '~/components/PrinterSelect.vue'
import { labelTypeConfig, type LabelTypeKey } from '~/types/label'
import { useLabelForm } from '~/composables/useLabelForm'
import { useLabelValidation } from '~/composables/useLabelValidation'
import { printers } from '~/config/printers'
import { usePreviewTimer } from '~/composables/usePreviewTimer'
import { useToast } from 'vue-toastification'
import { isFieldRequiredForType } from '~/composables/useSchemaRequirements'
import { useUrlFormSync } from '~/composables/useUrlFormSync'

const toast = useToast()
const previewRef = ref<{ render: () => Promise<void> } | null>(null)

const { form, getFieldValue, maxQuantity, printLabel } = useLabelForm()
const { isValid, getErrors } = useLabelValidation(form)

// start URL <> form sync
useUrlFormSync(form, getFieldValue)

// control whether validation errors should be shown
const showValidation = ref(false)

const triggerPreview = async () => { await previewRef.value?.render() }
const { start: startPreviewCountdown } = usePreviewTimer(triggerPreview, 1)

// auto-preview on form changes
watch(form, () => { startPreviewCountdown() }, { deep: true })

// hide validation when type changes (user switched type) and re-apply defaults elsewhere
watch(() => form.type, () => {
  showValidation.value = false
})

// hide validation automatically when the form becomes valid
watch(() => isValid(), (ok) => {
  if (ok) showValidation.value = false
})

// Print handler: show validation errors when invalid, otherwise send to printer and show toast.
async function handlePrint() {
  showValidation.value = true
  if (!isValid()) {
    // keep errors visible; don't send to printer
    return
  }

  try {
    await printLabel()
    toast('Sent to printer!')
  } catch (err) {
    toast('Failed to send to printer')
    console.error(err)
  }
}

// prepare options for selects
const typeOptions = computed(() =>
  Object.keys(labelTypeConfig).map(k => ({ label: k[0]?.toUpperCase() + k.slice(1), value: k }))
)

const sizeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Compact', value: 'compact' }
]
</script>

<template>
  <div class="max-w-lg mx-auto p-4 space-y-4">
    <PrinterSelect :show-validation="showValidation" :getErrors="(key: string) => getErrors(key) ?? []"
      v-model="form.printer" :printers="printers" />

    <FormField :errors="showValidation ? getErrors('type') : undefined" :required="true" label="Type" type="select"
      :options="typeOptions" v-model="form.type" />

    <div class="flex gap-4">
      <div class="w-full" v-if="labelTypeConfig[form.type].images?.length">
        <ImagePicker :show-validation="showValidation" :getErrors="(key: string) => getErrors(key) ?? []"
          :images="labelTypeConfig[form.type].images" :imageKey="form.image.key" :imageSize="form.image.size"
          @update:imageKey="v => form.image.key = v" @update:imageSize="v => form.image.size = v" />
      </div>
    </div>

    <FormField v-for="field in labelTypeConfig[form.type].fields" :key="field.key" :label="field.label"
      :type="field.type" :maxChars="field.maxChars" :model-value="getFieldValue(field.key).value"
      @update:model-value="val => (getFieldValue(field.key).value = val)"
      :errors="showValidation ? getErrors(field.key) : undefined"
      :required="isFieldRequiredForType(form.type as LabelTypeKey, field.key)" />

    <div class="flex">
      <div v-if="labelTypeConfig[form.type].allowSizeChange" class="mr-6 w-xl h-12">
        <FormField label="Label" type="select" :options="sizeOptions" v-model="form.size"
          :errors="showValidation ? getErrors('size') : undefined" :required="true" />
      </div>

      <div class="w-full">
        <FormField label="Quantity" type="number" v-model="form.qty"
          :errors="showValidation ? getErrors('qty') : undefined" :required="true" />
        <p class="text-xs text-right">Max {{ maxQuantity }} labels</p>
      </div>
    </div>

    <LabelPreview ref="previewRef" :payload="form" />
    <div class="flex">
      <button @click="handlePrint" class="bg-red-600 text-white py-2 rounded px-4 w-full cursor-pointer">Print</button>
    </div>
  </div>
</template>
