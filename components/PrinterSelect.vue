<script setup lang="ts">
import { computed } from 'vue'
import FormField from '~/components/FormField.vue'
import type { Printer } from '~/config/printers'

const props = defineProps<{ modelValue?: string; printers: Printer[] }>()
const emit = defineEmits<{
    (e: 'update:modelValue', value?: string): void
}>()

const options = computed(() =>
    (props.printers ?? []).map(p => ({ label: p.name, value: p.key }))
)

function onUpdate(v: string | number) {
    const str = String(v ?? '')
    emit('update:modelValue', str === '' ? undefined : str)
}
</script>

<template>
    <FormField :model-value="props.modelValue ?? ''" label="Printer" type="select" :options="options"
        @update:model-value="onUpdate" />
</template>