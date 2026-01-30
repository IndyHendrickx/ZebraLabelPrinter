<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'

type Option = { label: string; value: string | number }

const props = defineProps<{
  modelValue: string | number
  label: string
  type?: 'text' | 'textarea' | 'date' | 'number' | 'select'
  options?: readonly Option[]
  maxChars?: number
  errors?: readonly string[] | undefined
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

// explicitly typed Ref to avoid TS unwrapping issues in script
const internalValue: Ref<string | number> = ref<string | number>(props.modelValue)

watch(() => props.modelValue, (v) => {
  if (v !== internalValue.value) internalValue.value = v
})

watch(internalValue, (val) => {
  let out: string | number = val
  if (props.maxChars !== undefined && typeof val === 'string' && val.length > props.maxChars) {
    out = val.slice(0, props.maxChars)
    internalValue.value = out
  }
  emit('update:modelValue', out)
})

// handlers used from template (run in script context, so .value is valid)
function handleTextInput(e: Event) {
  internalValue.value = (e.target as HTMLInputElement).value
}

function handleNumberInput(e: Event) {
  const n = (e.target as HTMLInputElement).valueAsNumber
  internalValue.value = Number.isNaN(n) ? '' : n
}

function handleTextareaInput(e: Event) {
  internalValue.value = (e.target as HTMLTextAreaElement).value
}

function handleSelectChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  internalValue.value = v as unknown as string | number
}
</script>

<template>
  <div class="mb-3">
    <label class="block text-gray-700 text-lg font-bold mb-2">{{ label }}</label>

    <input :placeholder="label" v-if="type === 'text' || type === 'date'" :type="type === 'date' ? 'date' : 'text'"
      class="w-full border p-2 rounded h-12" :value="internalValue" @input="handleTextInput" />

    <input :placeholder="label" v-else-if="type === 'number'" type="number" class="w-full border p-2 rounded h-12"
      :value="internalValue" @input="handleNumberInput" />

    <textarea :placeholder="label" v-else-if="type === 'textarea'" class="w-full border p-2 rounded"
      :value="internalValue" @input="handleTextareaInput"></textarea>

    <select v-else-if="type === 'select'" class="w-full border p-2 rounded h-12" :value="internalValue"
      @change="handleSelectChange">
      <option v-for="opt in options ?? []" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <div v-if="errors && errors.length" class="text-red-600 text-sm mt-1">
      <div v-for="(err, i) in errors" :key="i">{{ err }}</div>
    </div>
  </div>
</template>
