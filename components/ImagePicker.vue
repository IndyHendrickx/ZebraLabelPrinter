<script setup lang="ts">
import { watch, onMounted, nextTick } from 'vue'
import FormField from '~/components/FormField.vue'
import type { LabelImageOption } from '~/types/label-images'
import type { ImageSize } from '~/types/label-images'

const props = defineProps<{
    images?: readonly LabelImageOption[]
    imageKey: string
    imageSize: ImageSize
    showValidation: boolean
    getErrors: (key: string) => readonly string[]
}>()

const emit = defineEmits<{
    (e: 'update:imageKey', value: string): void
    (e: 'update:imageSize', value: ImageSize): void
}>()

/**
 * Pick defaults for a given image set. When forceDefault is true (initial load / type change)
 * always pick the configured default image and its defaultSize (if present).
 */
function applyDefaultsFor(images: readonly LabelImageOption[] | undefined, forceDefault = false) {
    const imgs = images ?? []
    if (imgs.length === 0) return

    const def = imgs.find(i => i.isDefault) ?? imgs[0]!

    if (forceDefault) {
        emit('update:imageKey', def.key)
        const size = (def.defaultSize && def.availableSizes?.includes(def.defaultSize))
            ? def.defaultSize
            : (def.availableSizes && def.availableSizes.length ? def.availableSizes[0] : props.imageSize)
        emit('update:imageSize', size as ImageSize)
        return
    }

    const current = imgs.find(i => i.key === props.imageKey)

    if (!current) {
        emit('update:imageKey', def.key)
        const size = (def.defaultSize && def.availableSizes?.includes(def.defaultSize))
            ? def.defaultSize
            : (def.availableSizes && def.availableSizes.length ? def.availableSizes[0] : props.imageSize)
        emit('update:imageSize', size as ImageSize)
        return
    }

    if (current.availableSizes && current.availableSizes.length) {
        const preferred = (current.defaultSize && current.availableSizes.includes(current.defaultSize))
            ? current.defaultSize
            : current.availableSizes[0]
        if (props.imageSize !== preferred) emit('update:imageSize', preferred as ImageSize)
    }
}

/** Ensure when a specific key is selected the size follows that image's primary/default size. */
function ensureSizeForKey(key: string | undefined, images: readonly LabelImageOption[] | undefined) {
    if (!key) return
    const imgs = images ?? []
    const img = imgs.find(i => i.key === key)
    if (!img) return

    const preferred = img.defaultSize && img.availableSizes?.includes(img.defaultSize) ? img.defaultSize : undefined
    const size = preferred ?? (img.availableSizes && img.availableSizes.length ? img.availableSizes[0] : props.imageSize)
    emit('update:imageSize', size as ImageSize)
}

// Force default when images set changes (initial load or type change)
watch(
    () => props.images,
    (newImgs) => {
        nextTick().then(() => applyDefaultsFor(newImgs, true))
    },
    { immediate: true }
)

// When imageKey changes (user or external), ensure size follows the selected image
watch(
    () => props.imageKey,
    (newKey) => {
        nextTick().then(() => ensureSizeForKey(newKey, props.images))
    }
)

onMounted(() => {
    nextTick().then(() => applyDefaultsFor(props.images, true))
})

// Helpers to map to FormField options
function imageOptions(imgs?: readonly LabelImageOption[]) {
    return (imgs ?? []).map(i => ({ label: `${i.label}${i.isDefault ? ' (default)' : ''}`, value: i.key }))
}

function sizeOptionsFor(key: string | undefined, imgs?: readonly LabelImageOption[]) {
    const img = (imgs ?? []).find(i => i.key === key)
    return (img?.availableSizes ?? []).map(s => ({ label: String(s).toUpperCase(), value: s }))
}
</script>

<template>
    <div>
        <div class="flex items-start gap-4">
            <!-- Image select: use FormField (select) -->
            <div class="w-2/3">
                <FormField :errors="showValidation ? getErrors('imageKey') : undefined" :required="true"
                    :model-value="props.imageKey" label="Image" type="select" :options="imageOptions(props.images)"
                    @update:model-value="v => emit('update:imageKey', String(v))" />
            </div>

            <!-- Size select: use FormField (select) -->
            <div class="w-1/3">
                <FormField :errors="showValidation ? getErrors('imageSize') : undefined" :required="true"
                    :model-value="props.imageSize" label="Size" type="select"
                    :options="sizeOptionsFor(props.imageKey, props.images)"
                    @update:model-value="v => emit('update:imageSize', String(v) as ImageSize)" />
            </div>
        </div>
    </div>
</template>