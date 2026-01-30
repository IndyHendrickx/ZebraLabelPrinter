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

const previewRef = ref<{ render: () => Promise<void> } | null>(null)

const { form, getFieldValue, maxQuantity, printLabel } = useLabelForm()
const { validation } = useLabelValidation(form)

const triggerPreview = async () => { await previewRef.value?.render() }
const { start: startPreviewCountdown } = usePreviewTimer(triggerPreview, 1)

// auto-preview on form changes
watch(form, () => { startPreviewCountdown() }, { deep: true })

// keep image defaults in composable
watch(() => form.type, (type: LabelTypeKey) => {
  const cfg = labelTypeConfig[type]
  if (!cfg.allowSizeChange && cfg.fixedSize) form.size = cfg.fixedSize
})

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
    <PrinterSelect v-model="form.printer" :printers="printers" />

    <FormField label="Type" type="select" :options="typeOptions" v-model="form.type" />

    <div class="flex gap-4">
      <div class="w-full" v-if="labelTypeConfig[form.type].images?.length">
        <ImagePicker :images="labelTypeConfig[form.type].images" :imageKey="form.image.key" :imageSize="form.image.size"
          @update:imageKey="v => form.image.key = v" @update:imageSize="v => form.image.size = v" />
      </div>
    </div>

    <FormField v-for="field in labelTypeConfig[form.type].fields" :key="field.key" :label="field.label"
      :type="field.type" :maxChars="field.maxChars" :model-value="getFieldValue(field.key).value"
      @update:model-value="val => (getFieldValue(field.key).value = val)" :errors="validation.errors[field.key]" />

    <div class="flex">
      <div v-if="labelTypeConfig[form.type].allowSizeChange" class="mr-6 w-3xl h-12">
        <FormField label="Label" type="select" :options="sizeOptions" v-model="form.size" />
      </div>

      <div class="w-full">
        <FormField label="Quantity" type="number" v-model="form.qty" />
        <p class="text-xs text-right">Max {{ maxQuantity }} labels</p>
      </div>
    </div>

    <LabelPreview ref="previewRef" :payload="form" />
    <div class="flex">
      <button @click="printLabel" class="bg-red-600 text-white py-2 rounded px-4 w-full cursor-pointer">Print</button>
    </div>
  </div>
</template>
