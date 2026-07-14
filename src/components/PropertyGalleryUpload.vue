<template>
    <div class="property-gallery-upload">
        <LabelWithInfo label="Property Images" :help="help" />

        <div v-if="!projectId" class="text-secondary small">
            Save the property first, then upload images for units, rooms, and amenities.
        </div>

        <template v-else>
            <div v-if="pendingUploads.length" class="property-gallery-upload__pending">
                <p class="text-secondary small mb-2">
                    Add a label for each image so it is easy to pick in unit and room modals.
                </p>
                <div class="property-gallery-upload__grid">
                    <div
                        v-for="(pending, index) in pendingUploads"
                        :key="pending.key"
                        class="property-gallery-upload__card"
                    >
                        <figure class="property-gallery-upload__item">
                            <img
                                :src="pending.previewUrl"
                                :alt="pending.label || pending.file.name"
                                class="property-gallery-upload__image"
                            />
                        </figure>
                        <input
                            v-model="pending.label"
                            type="text"
                            class="form-control form-control-sm property-gallery-upload__label-input"
                            maxlength="80"
                            placeholder="Image label"
                            :aria-label="`Label for ${pending.file.name}`"
                        />
                        <button
                            type="button"
                            class="property-gallery-upload__pending-remove btn btn-sm btn-link text-danger p-0"
                            @click="removePendingUpload(index)"
                        >
                            Remove
                        </button>
                    </div>
                </div>
                <div class="property-gallery-upload__pending-actions">
                    <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        :disabled="uploading"
                        @click="confirmPendingUpload"
                    >
                        {{ uploading ? 'Uploading...' : `Upload ${pendingUploads.length} image${pendingUploads.length === 1 ? '' : 's'}` }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        :disabled="uploading"
                        @click="cancelPendingUpload"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div v-if="images.length" class="property-gallery-upload__grid">
                <div
                    v-for="image in images"
                    :key="image.id"
                    class="property-gallery-upload__card"
                >
                    <figure class="property-gallery-upload__item">
                        <img
                            :src="resolveUrl(image.url)"
                            :alt="displayLabel(image)"
                            class="property-gallery-upload__image"
                            @error="onImageError(image.id)"
                        />
                        <button
                            type="button"
                            class="property-gallery-upload__remove btn btn-sm btn-danger"
                            :disabled="removingId === image.id || uploading"
                            aria-label="Remove image"
                            @click="removeImage(image)"
                        >
                            <i class="ti ti-trash" aria-hidden="true"></i>
                        </button>
                    </figure>
                    <input
                        v-model="labelDrafts[image.id]"
                        type="text"
                        class="form-control form-control-sm property-gallery-upload__label-input"
                        maxlength="80"
                        placeholder="Image label"
                        :aria-label="`Label for image ${image.id}`"
                        :disabled="savingLabelId === image.id"
                        @blur="saveLabel(image)"
                        @keydown.enter.prevent="saveLabel(image)"
                    />
                    <span
                        v-if="savedLabelIds[image.id]"
                        class="property-gallery-upload__label-status text-success"
                    >
                        Saved
                    </span>
                </div>
            </div>

            <div v-else-if="!pendingUploads.length" class="property-gallery-upload__empty text-secondary small">
                No property images uploaded yet.
            </div>

            <div class="property-gallery-upload__actions">
                <label
                    class="btn btn-outline-primary btn-sm mb-0"
                    :class="{ disabled: uploading || disabled || pendingUploads.length > 0 }"
                >
                    <i class="ti ti-upload me-1" aria-hidden="true"></i>
                    Choose images
                    <input
                        ref="fileInput"
                        type="file"
                        class="property-gallery-upload__file-input"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        :disabled="uploading || disabled || pendingUploads.length > 0"
                        @change="onFilesSelected"
                    />
                </label>
            </div>

            <div class="text-secondary small mt-2">
                Upload photos once here, then assign them to units, rooms, or whole-property listings without re-uploading.
                Press Enter or click outside a label field to save it. JPG, PNG, WebP, or GIF. Max 5 MB each.
            </div>
        </template>
    </div>
</template>

<script>
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import { PROJECT_FIELD_HELP } from '@/constants/fieldHelp';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { defaultGalleryLabelFromFilename } from '@/utils/galleryLabel';
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';

export default {
    name: 'PropertyGalleryUpload',
    components: { LabelWithInfo },
    props: {
        projectId: {
            type: [Number, String],
            default: null,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:images'],
    data() {
        return {
            images: [],
            labelDrafts: {},
            pendingUploads: [],
            uploading: false,
            removingId: null,
            savingLabelId: null,
            savedLabelIds: {},
            brokenIds: {},
            help: PROJECT_FIELD_HELP.property_gallery,
        };
    },
    watch: {
        projectId: {
            immediate: true,
            handler() {
                this.cancelPendingUpload();
                this.loadGallery();
            },
        },
    },
    beforeUnmount() {
        this.revokePendingPreviews();
    },
    methods: {
        resolveUrl(url) {
            return resolveMediaUrl(url);
        },
        displayLabel(image) {
            const label = String(image?.label || this.labelDrafts[image?.id] || '').trim();
            return label || `Property image ${image?.id}`;
        },
        syncLabelDrafts() {
            const drafts = {};

            this.images.forEach((image) => {
                drafts[image.id] = image.label || '';
            });

            this.labelDrafts = drafts;
        },
        onImageError(imageId) {
            this.brokenIds = { ...this.brokenIds, [imageId]: true };
        },
        resetFileInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        revokePendingPreviews() {
            this.pendingUploads.forEach((pending) => {
                if (pending.previewUrl) {
                    URL.revokeObjectURL(pending.previewUrl);
                }
            });
        },
        async loadGallery() {
            if (!this.projectId) {
                this.images = [];
                this.labelDrafts = {};
                this.$emit('update:images', []);
                return;
            }

            try {
                const res = await this.$api.get(`/projects/${this.projectId}/gallery`);
                this.images = res.data || [];
                this.syncLabelDrafts();
                this.$emit('update:images', this.images);
            } catch (err) {
                console.error('Error loading property gallery:', err.response?.data || err);
                this.images = [];
                this.labelDrafts = {};
                this.$emit('update:images', []);
            }
        },
        onFilesSelected(event) {
            const files = [...(event.target.files || [])];
            this.resetFileInput();

            if (!files.length || !this.projectId) return;

            const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024);
            if (tooLarge) {
                showAppAlert('Each image must be 5 MB or smaller.');
                return;
            }

            this.revokePendingPreviews();
            this.pendingUploads = files.map((file, index) => ({
                key: `${file.name}-${file.lastModified}-${index}`,
                file,
                previewUrl: URL.createObjectURL(file),
                label: defaultGalleryLabelFromFilename(file.name),
            }));
        },
        removePendingUpload(index) {
            const [removed] = this.pendingUploads.splice(index, 1);
            if (removed?.previewUrl) {
                URL.revokeObjectURL(removed.previewUrl);
            }
        },
        cancelPendingUpload() {
            this.revokePendingPreviews();
            this.pendingUploads = [];
            this.resetFileInput();
        },
        async confirmPendingUpload() {
            if (!this.pendingUploads.length || !this.projectId) return;

            const formData = new FormData();
            const labels = this.pendingUploads.map((pending) => pending.label.trim());

            this.pendingUploads.forEach((pending) => {
                formData.append('images', pending.file);
            });
            formData.append('labels', JSON.stringify(labels));

            this.uploading = true;
            try {
                const res = await this.$api.post(`/projects/${this.projectId}/gallery`, formData);
                const uploaded = res.data?.images || [];
                this.images = [...this.images, ...uploaded];
                this.syncLabelDrafts();
                this.$emit('update:images', this.images);
                this.cancelPendingUpload();
            } catch (err) {
                console.error('Error uploading property gallery images:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to upload property images.'));
            } finally {
                this.uploading = false;
            }
        },
        async saveLabel(image, { quiet = false } = {}) {
            if (!this.projectId || !image?.id) return;

            const nextLabel = String(this.labelDrafts[image.id] || '').trim();
            const currentLabel = String(image.label || '').trim();

            if (nextLabel === currentLabel) return;

            this.savingLabelId = image.id;
            try {
                const res = await this.$api.patch(`/projects/${this.projectId}/gallery/${image.id}`, {
                    label: nextLabel,
                });
                const updated = res.data;
                this.images = this.images.map((item) => (
                    item.id === image.id ? { ...item, ...updated } : item
                ));
                this.labelDrafts[image.id] = updated.label || '';
                this.$emit('update:images', this.images);
                if (!quiet) {
                    this.savedLabelIds = { ...this.savedLabelIds, [image.id]: true };
                    setTimeout(() => {
                        const nextSaved = { ...this.savedLabelIds };
                        delete nextSaved[image.id];
                        this.savedLabelIds = nextSaved;
                    }, 1800);
                }
            } catch (err) {
                console.error('Error saving property gallery label:', err.response?.data || err);
                this.labelDrafts[image.id] = currentLabel;
                if (!quiet) {
                    showAppAlert(getApiErrorMessage(err, 'Failed to save image label.'));
                }
                throw err;
            } finally {
                this.savingLabelId = null;
            }
        },
        async saveAllPendingLabels() {
            const pending = this.images.filter((image) => {
                const nextLabel = String(this.labelDrafts[image.id] || '').trim();
                const currentLabel = String(image.label || '').trim();
                return nextLabel !== currentLabel;
            });

            for (const image of pending) {
                await this.saveLabel(image, { quiet: true });
            }

            return true;
        },
        async removeImage(image) {
            if (!this.projectId || !image?.id) return;

            this.removingId = image.id;
            try {
                await this.$api.delete(`/projects/${this.projectId}/gallery/${image.id}`);
                this.images = this.images.filter((item) => item.id !== image.id);
                const nextDrafts = { ...this.labelDrafts };
                delete nextDrafts[image.id];
                this.labelDrafts = nextDrafts;
                this.$emit('update:images', this.images);
            } catch (err) {
                console.error('Error removing property gallery image:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to remove property image.'));
            } finally {
                this.removingId = null;
            }
        },
    },
};
</script>
