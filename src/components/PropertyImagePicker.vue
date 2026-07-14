<template>
    <div class="property-image-picker">
        <LabelWithInfo v-if="label" :label="label" :help="help" />

        <div v-if="!projectId" class="text-secondary small">
            Select a property first to choose images from its gallery.
        </div>

        <div v-else-if="loading" class="text-secondary small">
            Loading property images...
        </div>

        <div v-else-if="!galleryImages.length" class="text-secondary small">
            No property images yet. Upload photos in the property add/edit modal first.
        </div>

        <div v-else class="property-image-picker__grid">
            <label
                v-for="image in galleryImages"
                :key="image.id"
                class="property-image-picker__item"
                :class="{ 'property-image-picker__item--selected': isSelected(image.url) }"
            >
                <input
                    v-model="selectedUrls"
                    class="property-image-picker__checkbox"
                    type="checkbox"
                    :value="image.url"
                    :disabled="disabled"
                    @change="emitSelection"
                />
                <img
                    :src="resolveUrl(image.url)"
                    :alt="displayLabel(image)"
                    class="property-image-picker__image"
                />
                <span class="property-image-picker__caption" :title="displayLabel(image)">
                    {{ displayLabel(image) }}
                </span>
            </label>
        </div>
    </div>
</template>

<script>
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { galleryImageDisplayLabel } from '@/utils/galleryLabel';
import LabelWithInfo from '@/components/LabelWithInfo.vue';

export default {
    name: 'PropertyImagePicker',
    components: { LabelWithInfo },
    props: {
        projectId: {
            type: [Number, String],
            default: null,
        },
        modelValue: {
            type: Array,
            default: () => [],
        },
        label: {
            type: String,
            default: 'Photos from property gallery',
        },
        help: {
            type: String,
            default: 'Choose one or more images already uploaded for this property.',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            galleryImages: [],
            selectedUrls: [],
            loading: false,
        };
    },
    watch: {
        projectId: {
            immediate: true,
            handler() {
                this.loadGallery();
            },
        },
        modelValue: {
            immediate: true,
            handler(value) {
                this.selectedUrls = [...(value || [])];
            },
        },
    },
    methods: {
        resolveUrl(url) {
            return resolveMediaUrl(url);
        },
        displayLabel(image) {
            return galleryImageDisplayLabel(image, image?.id);
        },
        isSelected(url) {
            return this.selectedUrls.includes(url);
        },
        emitSelection() {
            this.$emit('update:modelValue', [...this.selectedUrls]);
        },
        async loadGallery() {
            if (!this.projectId) {
                this.galleryImages = [];
                return;
            }

            this.loading = true;
            try {
                const res = await this.$api.get(`/projects/${this.projectId}/gallery`);
                this.galleryImages = res.data || [];
                this.selectedUrls = this.selectedUrls.filter((url) =>
                    this.galleryImages.some((image) => image.url === url),
                );
                this.emitSelection();
            } catch (err) {
                console.error('Error loading property gallery for picker:', err.response?.data || err);
                this.galleryImages = [];
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>
