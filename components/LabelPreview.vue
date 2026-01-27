<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ payload: any }>()
const img = ref('')

async function render() {
  try {
    const res = await $fetch<string>('/api/preview', { method: 'POST', body: { ...props.payload, useExternalAPI: false } })
    img.value = res
  } catch (err: any) {
    if (err.data?.code === 'BAD_REQUEST') {
      console.log(err.data)
    } else {
      console.log(err)
    }
  }
}

defineExpose({
  render
})
</script>

<template>
  <img v-if="img" :src="img" class="border rounded shadow w-full" />
</template>
