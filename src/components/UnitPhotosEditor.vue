<template>
    <div class="unit-photos-editor">
        <LabelWithInfo v-if="label" :label="label" />

        <PropertyImagePicker
            v-model="galleryUrls"
            :project-id="projectId"
            label="Select images to display from Property Gallery"
            :help="galleryHelp"
            :disabled="disabled"
        />

        <div class="unit-photos-editor__upload mt-3">
            <LabelWithInfo
                label="Upload additional images specific for this unit only"
                :help="uploadHelp"
                base-class="form-label mb-1"
            />

            <div class="property-gallery-upload__grid">
                <div
                    v-for="item in unitPhotoItems"
                    :key="item.key"
                    class="property-gallery-upload__card"
                >
                    <label
                        v-if="!item.pending && item.url"
                        class="unit-photos-editor__pick"
                        :class="{
                            'unit-photos-editor__pick--active': coverImageUrl === item.url,
                            'unit-photos-editor__pick--disabled': disabled,
                        }"
                    >
                        <input
                            type="radio"
                            class="unit-photos-editor__pick-input"
                            name="unit-cover-image"
                            :value="item.url"
                            :checked="coverImageUrl === item.url"
                            :disabled="disabled"
                            @change="setCoverImage(item.url)"
                        />
                        <figure class="property-gallery-upload__item">
                            <img
                                :src="item.previewUrl"
                                :alt="item.label"
                                class="property-gallery-upload__image"
                            />
                            <span
                                v-if="coverImageUrl === item.url"
                                class="unit-photos-editor__pick-tag"
                            >
                                Website Default
                            </span>
                            <span v-else class="unit-photos-editor__pick-hint">Set as default</span>
                            <div class="property-gallery-upload__toolbar">
                                <button
                                    type="button"
                                    class="property-gallery-upload__tool btn btn-sm btn-light"
                                    :disabled="disabled || croppingUrl === item.url || cropLoading || !unitId"
                                    aria-label="Crop image"
                                    @click.stop.prevent="openCrop(item)"
                                >
                                    <i class="ti ti-crop" aria-hidden="true"></i>
                                </button>
                                <button
                                    type="button"
                                    class="property-gallery-upload__tool btn btn-sm btn-danger"
                                    :disabled="disabled || removingUrl === item.url"
                                    aria-label="Remove image"
                                    @click.stop.prevent="removeUnitPhoto(item)"
                                >
                                    <i class="ti ti-trash" aria-hidden="true"></i>
                                </button>
                            </div>
                        </figure>
                    </label>

                    <template v-else>
                        <figure class="property-gallery-upload__item">
                            <img
                                :src="item.previewUrl"
                                :alt="item.label"
                                class="property-gallery-upload__image"
                            />
                            <div
                                v-if="item.status === 'uploading' || item.status === 'done'"
                                class="property-gallery-upload__progress"
                                role="progressbar"
                                :aria-valuenow="item.progress"
                                aria-valuemin="0"
                                aria-valuemax="100"
                                :aria-label="`Upload progress for ${item.label}`"
                            >
                                <div
                                    class="property-gallery-upload__progress-bar"
                                    :class="{
                                        'property-gallery-upload__progress-bar--done': item.status === 'done',
                                    }"
                                    :style="{ width: `${item.progress}%` }"
                                ></div>
                                <span class="property-gallery-upload__progress-label">
                                    {{ item.status === 'done' ? 'Uploaded' : `${item.progress}%` }}
                                </span>
                            </div>
                            <div
                                v-else-if="item.status === 'error'"
                                class="property-gallery-upload__progress property-gallery-upload__progress--error"
                            >
                                <span class="property-gallery-upload__progress-label">Failed</span>
                            </div>
                            <div
                                v-if="item.status !== 'uploading' && item.status !== 'done'"
                                class="property-gallery-upload__toolbar"
                            >
                                <button
                                    type="button"
                                    class="property-gallery-upload__tool btn btn-sm btn-danger"
                                    :disabled="uploading"
                                    aria-label="Remove image"
                                    @click.stop.prevent="removeUnitPhoto(item)"
                                >
                                    <i class="ti ti-trash" aria-hidden="true"></i>
                                </button>
                            </div>
                        </figure>
                        <span
                            v-if="item.status === 'queued' && !unitId"
                            class="property-gallery-upload__label-readonly text-warning"
                        >
                            Saves with unit
                        </span>
                    </template>
                </div>

                <div class="property-gallery-upload__card property-gallery-upload__card--add">
                    <button
                        type="button"
                        class="property-gallery-upload__add"
                        :disabled="disabled || uploading"
                        aria-label="Add images"
                        @click="openFilePicker"
                    >
                        <i class="ti ti-plus" aria-hidden="true"></i>
                        <span>{{ uploading ? 'Uploading...' : 'Add images' }}</span>
                    </button>
                </div>
            </div>

            <input
                ref="fileInput"
                type="file"
                class="property-gallery-upload__file-input"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                :disabled="disabled || uploading"
                @change.stop="onFilesSelected"
            />
        </div>

        <ImageCropModal
            :visible="cropOpen"
            :image-src="cropImageSrc"
            title="Crop unit photo"
            help-text="Drag corners or edges to resize the crop area. Drag inside the box to move it. Scroll to zoom."
            free-aspect
            confirm-label="Apply crop"
            @cancel="closeCropModal"
            @confirm="onCropConfirm"
        />
    </div>
</template>

<script>
import PropertyImagePicker from '@/components/PropertyImagePicker.vue';
import ImageCropModal from '@/components/ImageCropModal.vue';
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import { UNIT_FIELD_HELP } from '@/constants/fieldHelp';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { isUnitOwnedPhotoUrl } from '@/utils/unitPhotos';
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';

export default {
    name: 'UnitPhotosEditor',
    components: { PropertyImagePicker, ImageCropModal, LabelWithInfo },
    props: {
        projectId: {
            type: [Number, String],
            default: null,
        },
        unitId: {
            type: [Number, String],
            default: null,
        },
        modelValue: {
            type: Array,
            default: () => [],
        },
        coverImageUrl: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: 'Unit Photos',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:modelValue', 'update:coverImageUrl'],
    data() {
        return {
            pendingUploads: [],
            uploading: false,
            removingUrl: null,
            croppingUrl: null,
            cropOpen: false,
            cropImageSrc: '',
            cropObjectUrl: null,
            cropTargetUrl: '',
            cropLoading: false,
            galleryHelp: UNIT_FIELD_HELP.unit_gallery_photos,
            uploadHelp: UNIT_FIELD_HELP.unit_own_photos,
        };
    },
    computed: {
        galleryUrls: {
            get() {
                return (this.modelValue || []).filter((url) => !isUnitOwnedPhotoUrl(url));
            },
            set(value) {
                this.emitMerged(value, this.unitOwnedUrls);
            },
        },
        unitOwnedUrls() {
            return (this.modelValue || []).filter((url) => isUnitOwnedPhotoUrl(url));
        },
        unitPhotoItems() {
            const persisted = this.unitOwnedUrls.map((url) => ({
                key: url,
                url,
                previewUrl: this.resolveUrl(url),
                label: 'Unit photo',
                pending: false,
            }));

            const pending = this.pendingUploads.map((item) => ({
                key: item.key,
                url: null,
                previewUrl: item.previewUrl,
                label: item.file.name,
                pending: true,
                file: item.file,
                status: item.status,
                progress: item.progress,
            }));

            return [...persisted, ...pending];
        },
    },
    watch: {
        unitOwnedUrls: {
            immediate: true,
            handler(urls) {
                if (this.coverImageUrl && !(urls || []).includes(this.coverImageUrl)) {
                    this.$emit('update:coverImageUrl', '');
                }
            },
        },
    },
    beforeUnmount() {
        this.clearPendingPreviews();
        this.revokeCropObjectUrl();
    },
    methods: {
        resolveUrl(url) {
            return resolveMediaUrl(url);
        },
        emitMerged(galleryUrls, unitUrls) {
            this.$emit('update:modelValue', [...galleryUrls, ...unitUrls]);
        },
        setCoverImage(url) {
            if (this.disabled) return;
            this.$emit('update:coverImageUrl', url);
        },
        revokeCropObjectUrl() {
            if (this.cropObjectUrl) {
                URL.revokeObjectURL(this.cropObjectUrl);
                this.cropObjectUrl = null;
            }
        },
        async openCrop(item) {
            if (this.disabled || !item?.url || this.cropLoading) return;

            if (!this.unitId) {
                showAppAlert('Save the unit first, then crop uploaded photos.');
                return;
            }

            this.revokeCropObjectUrl();
            this.cropTargetUrl = item.url;
            this.cropLoading = true;

            try {
                const response = await fetch(this.resolveUrl(item.url));
                if (!response.ok) {
                    throw new Error('Could not load image.');
                }

                const blob = await response.blob();
                this.cropObjectUrl = URL.createObjectURL(blob);
                this.cropImageSrc = this.cropObjectUrl;
                this.cropOpen = true;
            } catch (err) {
                console.error('Error loading image for crop:', err);
                showAppAlert('Could not load the image for cropping. Please try again.');
                this.closeCropModal();
            } finally {
                this.cropLoading = false;
            }
        },
        closeCropModal() {
            this.cropOpen = false;
            this.cropImageSrc = '';
            this.cropTargetUrl = '';
            this.revokeCropObjectUrl();
        },
        async onCropConfirm(blob) {
            if (!this.unitId || !blob || !this.cropTargetUrl) return;

            const replaceUrl = this.cropTargetUrl;
            this.croppingUrl = replaceUrl;

            try {
                const formData = new FormData();
                formData.append('images', blob, 'unit-photo.jpg');
                formData.append('replace_url', replaceUrl);

                const res = await this.$api.post(`/units/${this.unitId}/images`, formData);
                const assetImageUrls = res.data?.asset_image_urls || [];
                const uploadedUrl = res.data?.uploaded?.[0] || '';

                this.$emit('update:modelValue', assetImageUrls);

                if (this.coverImageUrl === replaceUrl && uploadedUrl) {
                    this.$emit('update:coverImageUrl', uploadedUrl);
                }

                this.closeCropModal();
            } catch (err) {
                console.error('Error cropping unit photo:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to crop unit photo.'));
            } finally {
                this.croppingUrl = null;
            }
        },
        openFilePicker() {
            if (this.disabled || this.uploading) return;
            this.$refs.fileInput?.click();
        },
        resetFileInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        clearPendingPreviews() {
            this.pendingUploads.forEach((item) => {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
            this.pendingUploads = [];
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

            const queued = files.map((file, index) => ({
                key: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'queued',
                progress: 0,
            }));
            this.pendingUploads.push(...queued);

            if (this.unitId) {
                this.uploadFiles(queued);
            }
        },
        updatePendingState(key, patch) {
            this.pendingUploads = this.pendingUploads.map((item) => (
                item.key === key ? { ...item, ...patch } : item
            ));
        },
        removePendingByKeys(keys) {
            const keySet = new Set(keys);
            this.pendingUploads = this.pendingUploads.filter((item) => {
                if (!keySet.has(item.key)) return true;
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
                return false;
            });
        },
        async uploadSinglePending(item, unitId) {
            const formData = new FormData();
            formData.append('images', item.file);

            this.updatePendingState(item.key, { status: 'uploading', progress: 0 });

            const res = await this.$api.post(`/units/${unitId}/images`, formData, {
                onUploadProgress: (event) => {
                    if (!event.total) return;
                    const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
                    this.updatePendingState(item.key, { progress: percent });
                },
            });

            this.updatePendingState(item.key, { status: 'done', progress: 100 });
            return res.data || {};
        },
        async uploadFiles(items, unitId = null) {
            const id = unitId || this.unitId;
            if (!id || !items.length) return null;

            this.uploading = true;
            let latestUrls = null;
            const uploadedUrls = [];
            const doneKeys = [];
            let failedCount = 0;

            try {
                for (const item of items) {
                    try {
                        const data = await this.uploadSinglePending(item, id);
                        latestUrls = data.asset_image_urls || latestUrls;
                        uploadedUrls.push(...(data.uploaded || []));
                        doneKeys.push(item.key);
                    } catch (err) {
                        failedCount += 1;
                        this.updatePendingState(item.key, { status: 'error', progress: 0 });
                        console.error('Error uploading unit image:', err.response?.data || err);
                        if (err.response?.status === 404) {
                            showAppAlert('Unit photo upload is unavailable. Restart the API server (npm run dev in the api folder), then try again.');
                        }
                    }
                }

                if (latestUrls) {
                    this.$emit('update:modelValue', latestUrls);
                }

                // Default the website unit/listing card image to the first upload.
                if (!this.coverImageUrl && uploadedUrls[0]) {
                    this.$emit('update:coverImageUrl', uploadedUrls[0]);
                }

                this.removePendingByKeys(doneKeys);

                if (failedCount > 0) {
                    showAppAlert(
                        failedCount === 1
                            ? '1 photo failed to upload. Remove it or try again.'
                            : `${failedCount} photos failed to upload. Remove them or try again.`,
                    );
                }

                return latestUrls;
            } finally {
                this.uploading = false;
            }
        },
        removeUnitPhoto(item) {
            if (item.pending) {
                URL.revokeObjectURL(item.previewUrl);
                this.pendingUploads = this.pendingUploads.filter((pending) => pending.key !== item.key);
                return;
            }

            const nextUnitUrls = this.unitOwnedUrls.filter((url) => url !== item.url);
            this.emitMerged(this.galleryUrls, nextUnitUrls);
        },
        async flushPendingUploads(unitId) {
            if (!unitId || !this.pendingUploads.length) {
                return this.modelValue || [];
            }

            const items = this.pendingUploads.filter((item) => item.status !== 'done');
            const latestUrls = await this.uploadFiles(items, unitId);

            if (this.pendingUploads.some((item) => item.status === 'error')) {
                throw new Error('Some unit photos failed to upload.');
            }

            return latestUrls || this.modelValue || [];
        },
        hasPendingUploads() {
            return this.pendingUploads.length > 0;
        },
    },
};
</script>
