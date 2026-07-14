<template>
    <div class="property-gallery-upload">
        <LabelWithInfo label="Property Images" :help="help" />

        <div v-if="pendingUploads.length" class="property-gallery-upload__pending">
            <p class="text-secondary small mb-2">
                Add a label for each image so it is easy to pick in unit and room modals.
            </p>
            <div class="property-gallery-upload__grid">
                <div
                    v-for="(pending, index) in pendingUploads"
                    :key="pending.key"
                    class="property-gallery-upload__card"
                    :class="{
                        'property-gallery-upload__card--uploading': pending.status === 'uploading',
                        'property-gallery-upload__card--done': pending.status === 'done',
                        'property-gallery-upload__card--error': pending.status === 'error',
                    }"
                >
                    <figure class="property-gallery-upload__item">
                        <img
                            :src="pending.previewUrl"
                            :alt="pending.label || pending.file.name"
                            class="property-gallery-upload__image"
                        />
                        <div
                            v-if="pending.status === 'uploading' || pending.status === 'done'"
                            class="property-gallery-upload__progress"
                            role="progressbar"
                            :aria-valuenow="pending.progress"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            :aria-label="`Upload progress for ${pending.file.name}`"
                        >
                            <div
                                class="property-gallery-upload__progress-bar"
                                :class="{
                                    'property-gallery-upload__progress-bar--done': pending.status === 'done',
                                }"
                                :style="{ width: `${pending.progress}%` }"
                            ></div>
                            <span class="property-gallery-upload__progress-label">
                                {{ pending.status === 'done' ? 'Uploaded' : `${pending.progress}%` }}
                            </span>
                        </div>
                        <div
                            v-else-if="pending.status === 'error'"
                            class="property-gallery-upload__progress property-gallery-upload__progress--error"
                        >
                            <span class="property-gallery-upload__progress-label">Failed</span>
                        </div>
                    </figure>
                    <input
                        v-model="pending.label"
                        type="text"
                        class="form-control form-control-sm property-gallery-upload__label-input"
                        maxlength="80"
                        placeholder="Image label"
                        :aria-label="`Label for ${pending.file.name}`"
                        :disabled="uploading"
                    />
                    <button
                        type="button"
                        class="property-gallery-upload__pending-remove btn btn-sm btn-link text-danger p-0"
                        :disabled="uploading"
                        @click="removePendingUpload(index)"
                    >
                        Remove
                    </button>
                </div>
            </div>
            <div class="property-gallery-upload__pending-actions">
                <button
                    v-if="projectId"
                    type="button"
                    class="btn btn-primary btn-sm"
                    :disabled="uploading"
                    @click="confirmPendingUpload()"
                >
                    {{ uploading ? `Uploading ${uploadProgressSummary}...` : `Upload ${pendingUploads.length} image${pendingUploads.length === 1 ? '' : 's'}` }}
                </button>
                <p v-else class="text-secondary small mb-0 align-self-center">
                    Images will upload when you save the property.
                </p>
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

        <div
            v-if="images.length || !pendingUploads.length"
            class="property-gallery-upload__grid"
        >
            <div
                v-for="image in images"
                :key="image.id"
                class="property-gallery-upload__card"
            >
                <label
                    class="unit-photos-editor__pick"
                    :class="{
                        'unit-photos-editor__pick--active': isCoverImage(image.url),
                        'unit-photos-editor__pick--disabled': disabled || savingCover,
                    }"
                >
                    <input
                        type="radio"
                        class="unit-photos-editor__pick-input"
                        name="property-cover-image"
                        :value="image.url"
                        :checked="isCoverImage(image.url)"
                        :disabled="disabled || savingCover"
                        @change="setCoverImage(image.url)"
                    />
                    <figure class="property-gallery-upload__item">
                        <img
                            :src="resolveUrl(image.url)"
                            :alt="displayLabel(image)"
                            class="property-gallery-upload__image"
                            @error="onImageError(image.id)"
                        />
                        <span
                            v-if="isCoverImage(image.url)"
                            class="unit-photos-editor__pick-tag"
                        >
                            Website Default
                        </span>
                        <span v-else class="unit-photos-editor__pick-hint">Set as default</span>
                        <div class="property-gallery-upload__toolbar">
                            <button
                                type="button"
                                class="property-gallery-upload__tool btn btn-sm btn-light"
                                :disabled="disabled || croppingId === image.id || cropLoading || uploading || savingCover"
                                aria-label="Crop image"
                                @click.stop.prevent="openCrop(image)"
                            >
                                <i class="ti ti-crop" aria-hidden="true"></i>
                            </button>
                            <button
                                type="button"
                                class="property-gallery-upload__tool btn btn-sm btn-danger"
                                :disabled="removingId === image.id || uploading || savingCover || cropLoading"
                                aria-label="Remove image"
                                @click.stop.prevent="removeImage(image)"
                            >
                                <i class="ti ti-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </figure>
                </label>
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

            <div
                v-if="!pendingUploads.length"
                class="property-gallery-upload__card property-gallery-upload__card--add"
            >
                <button
                    type="button"
                    class="property-gallery-upload__add"
                    :disabled="uploading || disabled"
                    aria-label="Add images"
                    @click="openFilePicker"
                >
                    <i class="ti ti-plus" aria-hidden="true"></i>
                    <span>Add images</span>
                </button>
            </div>
        </div>

        <input
            ref="fileInput"
            type="file"
            class="property-gallery-upload__file-input"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            :disabled="uploading || disabled || pendingUploads.length > 0"
            @change="onFilesSelected"
        />

        <ImageCropModal
            :visible="cropOpen"
            :image-src="cropImageSrc"
            title="Crop property image"
            help-text="Drag corners or edges to resize the crop area. Drag inside the box to move it. Scroll to zoom."
            free-aspect
            confirm-label="Apply crop"
            @cancel="closeCropModal"
            @confirm="onCropConfirm"
        />
    </div>
</template>

<script>
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import ImageCropModal from '@/components/ImageCropModal.vue';
import { PROJECT_FIELD_HELP } from '@/constants/fieldHelp';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { defaultGalleryLabelFromFilename } from '@/utils/galleryLabel';
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';

export default {
    name: 'PropertyGalleryUpload',
    components: { LabelWithInfo, ImageCropModal },
    props: {
        projectId: {
            type: [Number, String],
            default: null,
        },
        coverImageUrl: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:images', 'update:coverImageUrl'],
    data() {
        return {
            images: [],
            labelDrafts: {},
            pendingUploads: [],
            uploading: false,
            removingId: null,
            savingLabelId: null,
            savingCover: false,
            savedLabelIds: {},
            brokenIds: {},
            croppingId: null,
            cropOpen: false,
            cropImageSrc: '',
            cropObjectUrl: null,
            cropTargetId: null,
            cropLoading: false,
            help: PROJECT_FIELD_HELP.property_gallery,
        };
    },
    computed: {
        uploadProgressSummary() {
            const total = this.pendingUploads.length;
            if (!total) return '';
            const done = this.pendingUploads.filter((item) => item.status === 'done').length;
            const current = Math.min(done + 1, total);
            return `${current}/${total}`;
        },
    },
    watch: {
        projectId: {
            immediate: true,
            handler() {
                this.cancelPendingUpload();
                this.loadGallery();
            },
        },
        coverImageUrl(nextCover) {
            // Only clear a stale cover after gallery has loaded and the URL is no longer present.
            if (!nextCover || !this.images.length) return;
            if (!this.images.some((image) => this.isCoverImage(image.url))) {
                this.$emit('update:coverImageUrl', '');
            }
        },
    },
    beforeUnmount() {
        this.revokePendingPreviews();
        this.revokeCropObjectUrl();
    },
    methods: {
        resolveUrl(url) {
            return resolveMediaUrl(url);
        },
        normalizedUrl(url) {
            return resolveMediaUrl(url);
        },
        isCoverImage(url) {
            const cover = this.normalizedUrl(this.coverImageUrl);
            const candidate = this.normalizedUrl(url);
            return Boolean(cover && candidate && cover === candidate);
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
        openFilePicker() {
            if (this.uploading || this.disabled || this.pendingUploads.length) return;
            this.$refs.fileInput?.click();
        },
        revokePendingPreviews() {
            this.pendingUploads.forEach((pending) => {
                if (pending.previewUrl) {
                    URL.revokeObjectURL(pending.previewUrl);
                }
            });
        },
        revokeCropObjectUrl() {
            if (this.cropObjectUrl) {
                URL.revokeObjectURL(this.cropObjectUrl);
                this.cropObjectUrl = null;
            }
        },
        async openCrop(image) {
            if (this.disabled || !image?.id || !image?.url || this.cropLoading) return;

            if (!this.projectId) {
                showAppAlert('Save the property first, then crop uploaded images.');
                return;
            }

            this.revokeCropObjectUrl();
            this.cropTargetId = image.id;
            this.cropLoading = true;

            try {
                const response = await fetch(this.resolveUrl(image.url));
                if (!response.ok) {
                    throw new Error('Could not load image.');
                }

                const blob = await response.blob();
                this.cropObjectUrl = URL.createObjectURL(blob);
                this.cropImageSrc = this.cropObjectUrl;
                this.cropOpen = true;
            } catch (err) {
                console.error('Error loading property gallery image for crop:', err);
                showAppAlert('Could not load the image for cropping. Please try again.');
                this.closeCropModal();
            } finally {
                this.cropLoading = false;
            }
        },
        closeCropModal() {
            this.cropOpen = false;
            this.cropImageSrc = '';
            this.cropTargetId = null;
            this.revokeCropObjectUrl();
        },
        async onCropConfirm(blob) {
            if (!this.projectId || !blob || !this.cropTargetId) return;

            const replaceAssetId = this.cropTargetId;
            this.croppingId = replaceAssetId;

            try {
                const formData = new FormData();
                formData.append('images', blob, 'property-gallery.jpg');
                formData.append('replace_asset_id', String(replaceAssetId));

                const res = await this.$api.post(`/projects/${this.projectId}/gallery`, formData);
                const updated = res.data?.image;
                if (!updated?.id) {
                    throw new Error('Crop response missing image.');
                }

                const nextUrl = resolveMediaUrl(updated.url);
                this.images = this.images.map((item) => (
                    item.id === updated.id
                        ? { ...item, ...updated, url: nextUrl }
                        : item
                ));
                this.syncLabelDrafts();
                this.$emit('update:images', this.images);

                if (res.data?.cover_image_url) {
                    this.$emit('update:coverImageUrl', resolveMediaUrl(res.data.cover_image_url));
                }

                this.closeCropModal();
            } catch (err) {
                console.error('Error cropping property gallery image:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to crop property image.'));
            } finally {
                this.croppingId = null;
            }
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
                this.images = (res.data || []).map((image) => ({
                    ...image,
                    url: resolveMediaUrl(image.url),
                }));
                this.syncLabelDrafts();
                this.$emit('update:images', this.images);
            } catch (err) {
                console.error('Error loading property gallery:', err.response?.data || err);
                this.images = [];
                this.labelDrafts = {};
                this.$emit('update:images', []);
            }
        },
        async setCoverImage(url, projectId = null) {
            const id = projectId || this.projectId;
            if (!id || !url || this.disabled) return;

            const nextCover = resolveMediaUrl(url);
            if (this.isCoverImage(nextCover) && !projectId) return;

            this.savingCover = true;
            try {
                const res = await this.$api.patch(`/projects/${id}/cover`, {
                    cover_image_url: nextCover,
                });
                this.$emit(
                    'update:coverImageUrl',
                    resolveMediaUrl(res.data?.cover_image_url || nextCover),
                );
            } catch (err) {
                console.error('Error setting property cover image:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to set website default image.'));
            } finally {
                this.savingCover = false;
            }
        },
        onFilesSelected(event) {
            const files = [...(event.target.files || [])];
            this.resetFileInput();

            if (!files.length) return;

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
                progress: 0,
                status: 'queued',
            }));
        },
        removePendingUpload(index) {
            if (this.uploading) return;
            const [removed] = this.pendingUploads.splice(index, 1);
            if (removed?.previewUrl) {
                URL.revokeObjectURL(removed.previewUrl);
            }
        },
        cancelPendingUpload({ force = false } = {}) {
            if (this.uploading && !force) return;
            this.revokePendingPreviews();
            this.pendingUploads = [];
            this.resetFileInput();
        },
        updatePendingState(key, patch) {
            this.pendingUploads = this.pendingUploads.map((item) => (
                item.key === key ? { ...item, ...patch } : item
            ));
        },
        async uploadSinglePending(pending, projectId = null) {
            const id = projectId || this.projectId;
            if (!id) throw new Error('Missing property id for gallery upload.');

            const formData = new FormData();
            formData.append('images', pending.file);
            formData.append('labels', JSON.stringify([pending.label.trim()]));

            this.updatePendingState(pending.key, { status: 'uploading', progress: 0 });

            const res = await this.$api.post(`/projects/${id}/gallery`, formData, {
                onUploadProgress: (event) => {
                    if (!event.total) return;
                    const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
                    this.updatePendingState(pending.key, { progress: percent });
                },
            });

            const uploaded = (res.data?.images || []).map((image) => ({
                ...image,
                sourceUrl: image.url,
                url: resolveMediaUrl(image.url),
            }));

            this.updatePendingState(pending.key, { status: 'done', progress: 100 });
            return uploaded;
        },
        async confirmPendingUpload(projectId = null) {
            const id = projectId || this.projectId;
            if (!this.pendingUploads.length || !id || this.uploading) return [];

            this.uploading = true;
            const uploadedAll = [];
            let failedCount = 0;

            try {
                for (const pending of [...this.pendingUploads]) {
                    if (pending.status === 'done') continue;

                    try {
                        const uploaded = await this.uploadSinglePending(pending, id);
                        uploadedAll.push(...uploaded);
                    } catch (err) {
                        failedCount += 1;
                        this.updatePendingState(pending.key, { status: 'error', progress: 0 });
                        console.error('Error uploading property gallery image:', err.response?.data || err);
                    }
                }

                if (uploadedAll.length) {
                    this.images = [...this.images, ...uploadedAll];
                    this.syncLabelDrafts();
                    this.$emit('update:images', this.images);

                    if (!this.coverImageUrl && uploadedAll[0]?.url) {
                        await this.setCoverImage(
                            uploadedAll[0].sourceUrl || uploadedAll[0].url,
                            id,
                        );
                    }
                }

                if (failedCount > 0) {
                    this.pendingUploads = this.pendingUploads.filter((item) => item.status === 'error');
                    throw new Error(
                        failedCount === 1
                            ? '1 image failed to upload. Remove it or try again.'
                            : `${failedCount} images failed to upload. Remove them or try again.`,
                    );
                }

                this.cancelPendingUpload({ force: true });
                return uploadedAll;
            } finally {
                this.uploading = false;
            }
        },
        async flushPendingUploads(projectId) {
            const id = projectId || this.projectId;
            if (!id) return this.images || [];
            if (!this.pendingUploads.length) return this.images || [];
            return this.confirmPendingUpload(id);
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
                    item.id === image.id
                        ? { ...item, ...updated, url: resolveMediaUrl(updated.url || item.url) }
                        : item
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
        async flushPendingBeforeSave() {
            if (this.projectId && this.pendingUploads.length) {
                await this.confirmPendingUpload(this.projectId);
            }
            await this.saveAllPendingLabels();
            return true;
        },
        hasPendingUploads() {
            return this.pendingUploads.length > 0;
        },
        async removeImage(image) {
            if (!this.projectId || !image?.id) return;

            this.removingId = image.id;
            try {
                await this.$api.delete(`/projects/${this.projectId}/gallery/${image.id}`);
                const wasCover = this.isCoverImage(image.url);
                this.images = this.images.filter((item) => item.id !== image.id);
                const nextDrafts = { ...this.labelDrafts };
                delete nextDrafts[image.id];
                this.labelDrafts = nextDrafts;
                this.$emit('update:images', this.images);
                if (wasCover) {
                    this.$emit('update:coverImageUrl', '');
                }
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
