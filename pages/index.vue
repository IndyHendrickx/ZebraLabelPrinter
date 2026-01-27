<script setup lang="ts">
import LabelPreview from '~/components/LabelPreview.vue'
import FormField from '~/components/FormField.vue'
import { labelTypeConfig, type LabelTypeKey } from '~/types/label'
import { useLabelForm } from '~/composables/useLabelForm'
import { useLabelValidation } from '~/composables/useLabelValidation'
import { computed, watch } from 'vue'
import type { LabelImageOption } from '~/types/label-images'
import { ref } from 'vue'

const previewRef = ref<{
  render: () => Promise<void>
} | null>(null)
const { form, getFieldValue, maxQuantity, printLabel } = useLabelForm()
const { validation } = useLabelValidation(form)

watch(() => form.type, type => {
  setDefaultImage(type)
  const cfg = labelTypeConfig[type]
  if (!cfg.allowSizeChange && cfg.fixedSize) {
    form.size = cfg.fixedSize
  }
})

watch(() => form.image.key, (key) => {
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
    <select id="Type" v-model="form.type" class="w-full border p-2 rounded">
      <option v-for="(cfg, key) in labelTypeConfig" :key="key" :value="key">{{ key[0] !== undefined ?
        key[0].toUpperCase() + key.slice(1) : '' }}</option>
    </select>

    <div class="flex gap-4">
      <div class="w-full" v-if="labelTypeConfig[form.type].images?.length">
        <label for="Image" class="block text-gray-700 text-lg font-bold mb-2">Image</label>
        <select id="Image" v-model="form.image.key" class="w-full border p-2 rounded">
          <option v-for="img in labelTypeConfig[form.type].images" :key="img.key" :value="img.key">
            {{ img.label }} {{ img.isDefault ? '(default)' : '' }}
          </option>
        </select>
      </div>
      <div v-if="selectedImage?.availableSizes?.length">
        <label class="block text-gray-700 text-lg font-bold mb-2">Image Size</label>
        <div class="flex gap-4">
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
      <div class="content-center mr-12" v-if="labelTypeConfig[form.type].allowSizeChange">
        <label for="Label" class="block text-gray-700 text-lg font-bold mb-2">Label</label>
        <div id="Label" class="flex gap-4 min-h-14.5 text-center">
          <label><input type="radio" value="normal" v-model="form.size"> Normal</label>
          <label><input type="radio" value="compact" v-model="form.size"> Compact</label>
        </div>
      </div>
      <div class="w-full">
        <label for="Quantity" class="block text-gray-700 text-lg font-bold mb-2">Quantity</label>
        <input id="Quantity" type="number" v-model.number="form.qty" min="1" :max="maxQuantity"
          class="w-full border p-2 rounded" />
        <p class="text-xs text-right">Max {{ maxQuantity }} labels</p>
      </div>
    </div>

    <div class="hidden">
      <input id="Template" type="text" v-model.template="form.template" class="w-full border p-2 rounded" />
    </div>

    <div class="flex">
      <button @click="previewRef?.render()"
        class="bg-blue-600 text-white py-2 rounded w-full m-0.5 cursor-pointer">Preview</button>
      <button @click="printLabel" class="bg-red-600 text-white py-2 rounded w-full m-0.5 cursor-pointer">Print</button>
    </div>
    <LabelPreview ref="previewRef" :payload="form" />

  </div>
</template>
