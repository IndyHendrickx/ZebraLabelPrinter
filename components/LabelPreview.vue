<script setup lang="ts">
import { ref } from 'vue'
import type { LabelForm } from '~/types/label'

const props = defineProps<{ payload: LabelForm & { printer?: string } }>()
const img = ref('')

function isFetchError(obj: unknown): obj is { data?: { code?: string } } {
  return typeof obj === 'object' && obj !== null && 'data' in (obj as Record<string, unknown>)
}

async function render() {
  try {
    const res = await $fetch<string>('/api/preview', {
      method: 'POST',
      body: { ...props.payload, useExternalAPI: false }
    })
    img.value = res
  } catch (err: unknown) {
    if (isFetchError(err) && err.data?.code === 'BAD_REQUEST') {
      console.log(err.data)
    } else {
      console.log(err)
    }
  }
}

defineExpose({ render })
</script>

<template>
  <img v-if="img" :src="img" class="border rounded shadow w-full" />
</template>
