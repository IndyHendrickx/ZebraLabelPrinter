<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | number
  label: string
  type?: 'text' | 'textarea' | 'date' | 'number'
  maxChars?: number
}>()

const emit = defineEmits(['update:modelValue'])
const internalValue = ref(props.modelValue)
watch(internalValue, (val) => {
  let newVal = val
  if (props.maxChars !== undefined && typeof val === 'string' && val.length > props.maxChars) {
    console.log('Max chars hit - slicing')
    newVal = val.slice(0, props.maxChars)
    internalValue.value = newVal
  }
  emit('update:modelValue', newVal)
})

watch(() => props.modelValue, (val) => {
  if (val !== internalValue.value) internalValue.value = val
})
</script>

<template>
  <div>
    <label :for="label" class="block text-gray-700 text-lg font-bold mb-2">
      {{ label }}
    </label>

    <textarea v-if="type === 'textarea'" v-model="internalValue" :placeholder="label" :id="label"
      class="w-full border p-2 rounded uppercase"></textarea>

    <input v-else :type="type ?? 'text'" v-model="internalValue" :placeholder="label" :id="label"
      class="w-full border p-2 rounded uppercase" />

    <p v-if="maxChars && typeof internalValue === 'string'" class="text-xs text-right">
      {{ maxChars - internalValue.length }} chars left
    </p>
  </div>
</template>
