<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import LabelPreview from '~/components/LabelPreview.vue'
import FormField from '~/components/FormField.vue'
import { labelTypeConfig, type LabelTypeKey } from '~/types/label'
import { useLabelForm } from '~/composables/useLabelForm'
import { useLabelValidation } from '~/composables/useLabelValidation'
import type { LabelImageOption } from '~/types/label-images'

const previewRef = ref<{ render: () => Promise<void> } | null>(null)

const { form, getFieldValue, maxQuantity, printLabel } = useLabelForm()
useLabelValidation(form)

const countdown = ref<number | null>(null)
let timerId: ReturnType<typeof setInterval> | null = null
const hasChangedOnce = ref(false)

function cancelPreviewCountdown() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  countdown.value = null
}

function startPreviewCountdown() {
  cancelPreviewCountdown()
  countdown.value = 1

  timerId = setInterval(async () => {
    if (countdown.value === null) return

    countdown.value--

    if (countdown.value <= 0) {
      cancelPreviewCountdown()
      await previewRef.value?.render()
    }
  }, 1000)
}

function manualPreview() {
  cancelPreviewCountdown()
  previewRef.value?.render()
}

watch(
  form,
  () => {
    if (!hasChangedOnce.value) {
      hasChangedOnce.value = true
    }
    startPreviewCountdown()
  },
  { deep: true }
)

watch(() => form.type, type => {
  setDefaultImage(type)
  const cfg = labelTypeConfig[type]
  if (!cfg.allowSizeChange && cfg.fixedSize) {
    form.size = cfg.fixedSize
  }
})

watch(() => form.image.key, key => {
  const img = labelTypeConfig[form.type].images?.find(i => i.key === key)
  if (img) {
    form.image.size = img.defaultSize ?? img.availableSizes?.[0] ?? 'm'
  }
})

const selectedImage = computed<LabelImageOption | undefined>(() => {
  return labelTypeConfig[form.type].images
    ?.find(i => i.key === form.image.key)
})

function setDefaultImage(type: LabelTypeKey) {
  const cfg = labelTypeConfig[type]
  const defaultImg = cfg.images?.find(i => i.isDefault) ?? cfg.images?.[0]
  if (defaultImg) {
    form.image.key = defaultImg.key
    form.image.size = defaultImg.defaultSize ?? defaultImg.availableSizes?.[0] ?? 'm'
  }
}

setDefaultImage(form.type)
</script>

<template>
  <div class="max-w-lg mx-auto p-4 space-y-4">

    <label for="Type" class="block text-gray-700 text-lg font-bold mb-2">Type</label>
    <select id="Type" v-model="form.type" class="w-full border p-2 rounded h-12">
      <option v-for="(cfg, key) in labelTypeConfig" :key="key" :value="key">
        {{ key[0]?.toUpperCase() + key.slice(1) }}
      </option>
    </select>

    <div class="flex gap-4">
      <div class="w-full" v-if="labelTypeConfig[form.type].images?.length">
        <label for="Image" class="block text-gray-700 text-lg font-bold mb-2">Image</label>
        <select id="Image" v-model="form.image.key" class="w-full border p-2 rounded h-12">
          <option v-for="img in labelTypeConfig[form.type].images" :key="img.key" :value="img.key">
            {{ img.label }} {{ img.isDefault ? '(default)' : '' }}
          </option>
        </select>
      </div>

      <div v-if="selectedImage?.availableSizes?.length">
        <label class="block text-gray-700 text-lg font-bold mb-2">Image Size</label>
        <div class="flex gap-4 h-12">
          <label :for="'ImageSize' + size.toUpperCase()" v-for="size in selectedImage.availableSizes" :key="size">
            <input :id="'ImageSize' + size.toUpperCase()" type="radio" :value="size" v-model="form.image.size" />
            {{ size.toUpperCase() }}
          </label>
        </div>
      </div>
    </div>

    <FormField v-for="field in labelTypeConfig[form.type].fields" :key="field.key" :label="field.label"
      :type="field.type" :maxChars="field.maxChars" :model-value="getFieldValue(field.key).value"
      @update:model-value="val => getFieldValue(field.key).value = val" />

    <div class="flex">
      <div v-if="labelTypeConfig[form.type].allowSizeChange" class="mr-12 h-12">
        <label class="block text-gray-700 text-lg font-bold mb-2">Label</label>
        <div class="flex gap-4">
          <label for="LabelNormal"><input id="LabelNormal" type="radio" value="normal" v-model="form.size">
            Normal</label>
          <label for="LabelCompact"><input id="LabelCompact" type="radio" value="compact" v-model="form.size">
            Compact</label>
        </div>
      </div>

      <div class="w-full">
        <label for="Quantity" class="block text-gray-700 text-lg font-bold mb-2">Quantity</label>
        <input id="Quantity" type="number" v-model.number="form.qty" min="1" :max="maxQuantity"
          class="w-full border p-2 rounded h-12" />
        <p class="text-xs text-right">Max {{ maxQuantity }} labels</p>
      </div>
    </div>

    <LabelPreview ref="previewRef" :payload="form" />

    <div class="flex">
      <button @click="printLabel" class="bg-red-600 text-white py-2 rounded w-full m-0.5 cursor-pointer">
        Print
      </button>
    </div>
  </div>
</template>
