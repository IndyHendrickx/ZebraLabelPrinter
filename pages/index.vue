<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import LabelPreview from '~/components/LabelPreview.vue'

enum Sizes {
  Normal = "normal",
  Compact = "compact",
  Larger = "larger",
  OnlyText = "onlytext"
}

const form = reactive({
  type: 'food' as const,
  size: "normal" as Sizes,
  date: new Date().toISOString().slice(0, 10),
  item: '',
  qty : 1
})


watch(() => form.size, () => {
  form.qty = form.size === 'compact' ? 2 : 1
})

watch(() => form.qty, () => {
  form.qty = form.qty > maxLabels.value ? maxLabels.value : form.qty
})

watch(() => form.type, () => {
  if(form.type == "address")
  {
    
  }

}

async function printLabel () {

  await $fetch('/api/print', { method: 'POST', body: form })
  alert('Sent to printer!')
}

const maxChars = { larger: 120, normal: 90, compact: 60 }
watch(() => form.size, () => {
  form.qty  = form.size === 'compact' ? 2 : 1
  const max = maxChars[form.size]
  if (form.item.length > max) form.item = form.item.slice(0, max)
})
const remainingChars = computed(() => maxChars[form.size] - form.item.length)

const maxLabelsSize = { large: 10, normal: 10, compact: 20 }
const maxLabels = computed(() => maxLabelsSize[form.size])
</script>

<template>
  <div class="max-w-md mx-auto p-4 space-y-4">

    <!-- type -->
    <label class="block text-gray-700 text-lg font-bold mb-2" for="form.type">Type</label>
    <select v-model="form.type" class="w-full border p-2 rounded">
      <option value="food">Food</option>
      <option value="storage">Storage</option>
      <option value="reminder">Reminder</option>
      <option value="address">Address (Envelope)</option>
      <option value="reindeer">Christmas Card</option>
      <option value="unknown">Unknown</option>
    </select>

    <!-- date -->
    <label class="block text-gray-700 text-lg font-bold mb-2" for="form.date">Date</label>
    <input v-model="form.date" type="date" class="w-full border p-2 rounded" />
    
    <!-- description -->
    <label class="block text-gray-700 text-lg font-bold mb-2" for="form.item">Description</label>
    <div>
      <input v-model="form.item"
             class="w-full border p-2 rounded font-bold uppercase"
             placeholder="Description" required />
      <p class="text-xs text-right">{{ remainingChars }} chars left</p>
    </div>

    <!-- size radio -->
     <label class="block text-gray-700 text-lg font-bold mb-2" for="form.size">Label</label>
    <div class="flex gap-4">
      <label><input type="radio" value="normal"  v-model="form.size"> Normal</label>
      <label><input type="radio" value="compact" v-model="form.size"> Compact</label>
      <label><input type="radio" value="larger" v-model="form.size"> Larger Icon - No Date</label>
    </div>

    <!-- qty -->
     <div>
      <input v-model.number="form.qty"
           :min="form.size==='compact'?2:1"
           :step="form.size==='compact'?2:1"
           type="number"
           :max="maxLabels"
           class="w-full border p-2 rounded" />
      <p class="text-xs text-right">Max {{ maxLabels }} labels {{ form.size==='compact'?" (2 labels / sticker)":" (1 label / sticker)" }}</p>
    </div>

    <!-- live preview -->
    <LabelPreview :payload="form" />
    
    <!-- print button -->
    <button @click="printLabel"
            class="bg-blue-600 text-white py-2 rounded w-full cursor-pointer flex items-center justify-center gap-2">Print
    </button>
  </div>
</template>
