<script setup lang="ts">
import { ref, watch } from 'vue'
import { zplToPng } from 'zpl-image'

const props = defineProps<{ payload: any }>()      // same object you POST to /print
const imgSrc = ref('')

watch(props.payload, async () => {
  if (!props.payload.item) return                // empty form → skip
  const zpl = await $fetch('/api/print', {       // ask API for preview only
    method: 'POST', params: { preview: 1 }, body: props.payload
  }).then(r => r.zpl)

  const png = await zplToPng(zpl, 203)
  imgSrc.value = `data:image/png;base64,${png}`
}, { deep: true })
</script>

<template>
  <img v-if="imgSrc" :src="imgSrc" class="border rounded shadow w-full" />
</template>
