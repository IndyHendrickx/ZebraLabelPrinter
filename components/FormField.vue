<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'

type Option = { label: string; value: string | number }

const props = defineProps<{
  modelValue: string | number | Date
  label: string
  type?: 'text' | 'textarea' | 'date' | 'number' | 'select'
  options?: readonly Option[]
  maxChars?: number
  errors?: readonly string[] | undefined
  required?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | Date): void
}>()

const internalValue: Ref<string | number | Date> = ref(props.modelValue)

watch(() => props.modelValue, (v) => {
  if (v !== internalValue.value) internalValue.value = v as any
})

watch(internalValue, (val) => {
  let out: string | number | Date = val
  if (props.maxChars !== undefined && typeof val === 'string' && val.length > props.maxChars) {
    out = val.slice(0, props.maxChars)
    internalValue.value = out
  }
  emit('update:modelValue', out)
})

function formatDateToInput(d: Date | string | undefined) {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(String(d))
  if (Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseInputToDate(value: string) {
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? null : date
}

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

function handleDateInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  const d = parseInputToDate(v)
  internalValue.value = d ?? ''
}
</script>

<template>
  <div class="mb-3">
    <label class="block text-gray-700 text-lg font-bold mb-2">
      {{ label }} <span v-if="required" class="text-red-600 ml-1">*</span>
    </label>

    <input v-if="type === 'text'" type="text" :placeholder="label" class="w-full border p-2 rounded h-12"
      :value="internalValue as string" @input="handleTextInput" :required="required" />

    <input v-else-if="type === 'date'" type="date" class="w-full border p-2 rounded h-12"
      :value="formatDateToInput(internalValue as Date | string)" @input="handleDateInput" :required="required" />

    <input v-else-if="type === 'number'" type="number" class="w-full border p-2 rounded h-12"
      :value="internalValue as number" @input="handleNumberInput" :required="required" />

    <textarea v-else-if="type === 'textarea'" :placeholder="label" class="w-full border p-2 rounded"
      :value="internalValue as string" @input="handleTextareaInput" :required="required" />

    <select v-else-if="type === 'select'" class="w-full border p-2 rounded h-12"
      :value="internalValue as string | number" @change="handleSelectChange" :required="required">
      <option v-for="opt in options ?? []" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
    </select>

    <div v-if="errors && errors.length" class="text-red-600 text-sm mt-1">
      <div v-for="(err, i) in errors" :key="i">{{ err }}</div>
    </div>
  </div>
</template>
