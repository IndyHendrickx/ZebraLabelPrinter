<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ payload: any }>()
const img   = ref('')
let timer: NodeJS.Timeout | null = null

renderPreview(props.payload);
watch(props.payload, data => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    renderPreview(data);
  }, 1000)
}, { deep: true })

async function renderPreview(data){
    const { zpl } = await $fetch('/api/print', {
      method : 'POST',
      params : { preview: 1 },
      body   : data
    })
    img.value = await $fetch('/api/preview', {
      method : 'POST',
      body   : { zpl }
    })
}
</script>

<template>
  <img v-if="img" :src="img" class="border rounded shadow w-full" />
</template>
