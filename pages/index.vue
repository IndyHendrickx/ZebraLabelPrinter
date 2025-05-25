<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import LabelPreview from '~/components/LabelPreview.vue'

const form = reactive({
  type: 'food' as const,
  size: 'normal' as const,        // default Normal
  date: new Date().toISOString().slice(0, 10),
  item: '',
  qty : 1
})

/* size ↔ qty logic ----------------------------------- */
watch(() => form.size, () => {
  form.qty = form.size === 'compact' ? 2 : 1
})

watch(() => form.qty, () => {
  form.qty = form.qty > 10 ? 10 : form.qty
})

async function printLabel () {
  await $fetch('/api/print', { method: 'POST', body: form })
  alert('Sent to printer!')
}

const maxLen = computed(() => form.size === 'compact' ? 60 : 90)
const remaining = computed(() => maxLen.value - form.item.length)
</script>

<template>
  <div class="max-w-md mx-auto p-4 space-y-4">

    <!-- type -->
    <select v-model="form.type" class="w-full border p-2 rounded">
      <option value="food">Food</option>
      <option value="storage">Storage</option>
      <option value="reminder">Reminder</option>
      <option value="unknown">Unknown</option>
    </select>

    <!-- date & description -->
    <input v-model="form.date" type="date" class="w-full border p-2 rounded" />

    <div>
      <input v-model="form.item"
             :maxlength="maxLen"
             class="w-full border p-2 rounded font-bold uppercase"
             placeholder="Description (ASCII only)" />
      <p class="text-xs text-right">{{ remaining }} chars left</p>
    </div>

    <!-- size radio -->
    <div class="flex gap-4">
      <label><input type="radio" value="normal"  v-model="form.size"> Normal</label>
      <label><input type="radio" value="compact" v-model="form.size"> Compact</label>
    </div>

    <!-- qty -->
    <input v-model.number="form.qty"
           :min="form.size==='compact'?2:1"
           :step="form.size==='compact'?2:1"
           class="w-full border p-2 rounded" />

    <!-- print button -->
    <button @click="printLabel"
            class="bg-blue-600 text-white py-2 rounded w-full cursor-pointer flex items-center justify-center gap-2">Print
    </button>

    <!-- live preview -->
    <LabelPreview :payload="form" />
  </div>
</template>
