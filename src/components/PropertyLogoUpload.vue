<template>
    <div class="property-logo-upload">
        <LabelWithInfo label="Property Logo" :help="help" />

        <div class="property-logo-upload__preview-wrap">
            <div
                class="property-logo-upload__preview"
                :class="{
                    'property-logo-upload__preview--empty': !displayUrl || previewFailed,
                    'property-logo-upload__preview--busy': uploading || disabled || cropOpen,
                }"
            >
                <button
                    type="button"
                    class="property-logo-upload__hit"
                    :disabled="uploading || disabled || cropOpen"
                    :aria-label="displayUrl ? 'Replace property logo' : 'Upload property logo'"
                    @click="openFilePicker"
                >
                    <img
                        v-if="resolvedLogoUrl && !previewFailed"
                        :key="resolvedLogoUrl"
                        :src="resolvedLogoUrl"
                        alt=""
                        class="property-logo-upload__image"
                        @error="onPreviewError"
                        @load="previewFailed = false"
                    />
                    <div v-else class="property-logo-upload__placeholder text-secondary">
                        <i class="ti ti-upload" aria-hidden="true"></i>
                        <span>Upload Logo</span>
                    </div>
                </button>

                <div v-if="displayUrl && !uploading" class="property-gallery-upload__toolbar">
                    <button
                        type="button"
                        class="property-gallery-upload__tool btn btn-sm btn-danger"
                        :disabled="removing || disabled || cropOpen"
                        aria-label="Remove logo"
                        @click.stop.prevent="removeLogo"
                    >
                        <i class="ti ti-trash" aria-hidden="true"></i>
                    </button>
                </div>

                <div
                    v-if="uploading"
                    class="property-logo-upload__progress"
                    role="progressbar"
                    :aria-valuenow="uploadProgress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Logo upload progress"
                >
                    <div
                        class="property-logo-upload__progress-bar"
                        :class="{ 'property-logo-upload__progress-bar--done': uploadProgress >= 100 }"
                        :style="{ width: `${uploadProgress}%` }"
                    ></div>
                    <span class="property-logo-upload__progress-label">
                        {{ uploadProgress >= 100 ? 'Uploaded' : `${uploadProgress}%` }}
                    </span>
                </div>
            </div>

            <input
                ref="fileInput"
                type="file"
                class="property-logo-upload__file-input"
                accept="image/jpeg,image/png,image/webp,image/gif"
                :disabled="uploading || disabled || cropOpen"
                @change="onFileSelected"
            />
        </div>

        <div v-if="pendingBlob && !projectId" class="text-secondary small mt-2">
            Logo will upload when you save the property.
        </div>
        <div v-else-if="!displayUrl" class="text-secondary small mt-2">
            JPG, PNG, WebP, or GIF. Max 5 MB. Cropped to a square before upload.
        </div>

        <ImageCropModal
            :visible="cropOpen"
            :image-src="cropImageSrc"
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
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';

export default {
    name: 'PropertyLogoUpload',
    components: { LabelWithInfo, ImageCropModal },
    props: {
        projectId: {
            type: [Number, String],
            default: null,
        },
        logoUrl: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:logoUrl'],
    data() {
        return {
            uploading: false,
            uploadProgress: 0,
            removing: false,
            previewFailed: false,
            logoCacheKey: 0,
            help: PROJECT_FIELD_HELP.property_logo,
            cropOpen: false,
            cropImageSrc: '',
            cropObjectUrl: null,
            pendingBlob: null,
            pendingPreviewUrl: null,
        };
    },
    computed: {
        displayUrl() {
            return String(this.pendingPreviewUrl || this.logoUrl || '').trim();
        },
        resolvedLogoUrl() {
            const base = this.pendingPreviewUrl
                ? this.pendingPreviewUrl
                : resolveMediaUrl(String(this.logoUrl || '').trim());
            if (!base) return '';
            // Blob previews should not get cache-bust query params.
            if (base.startsWith('blob:')) return base;
            const sep = base.includes('?') ? '&' : '?';
            return this.logoCacheKey ? `${base}${sep}v=${this.logoCacheKey}` : base;
        },
    },
    watch: {
        logoUrl(value) {
            this.previewFailed = false;
            const next = String(value || '').trim();
            // Drop local blob preview once the real uploaded URL arrives.
            if (next && !next.startsWith('blob:') && this.pendingPreviewUrl) {
                URL.revokeObjectURL(this.pendingPreviewUrl);
                this.pendingPreviewUrl = null;
                this.pendingBlob = null;
            }
        },
    },
    beforeUnmount() {
        this.revokeCropObjectUrl();
        this.clearPendingPreview({ emit: false });
    },
    methods: {
        onPreviewError() {
            this.previewFailed = true;
        },
        openFilePicker() {
            if (this.uploading || this.disabled || this.cropOpen) return;
            this.$refs.fileInput?.click();
        },
        resetFileInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        revokeCropObjectUrl() {
            if (this.cropObjectUrl) {
                URL.revokeObjectURL(this.cropObjectUrl);
                this.cropObjectUrl = null;
            }
        },
        clearPendingPreview({ emit = false } = {}) {
            if (this.pendingPreviewUrl) {
                URL.revokeObjectURL(this.pendingPreviewUrl);
            }
            this.pendingBlob = null;
            this.pendingPreviewUrl = null;
            if (emit) {
                this.$emit('update:logoUrl', '');
            }
        },
        setLocalPreview(blob) {
            if (this.pendingPreviewUrl) {
                URL.revokeObjectURL(this.pendingPreviewUrl);
            }
            this.pendingBlob = blob;
            this.pendingPreviewUrl = URL.createObjectURL(blob);
            this.previewFailed = false;
            this.logoCacheKey = Date.now();
            // Push preview to parent so it stays visible in the modal immediately.
            this.$emit('update:logoUrl', this.pendingPreviewUrl);
        },
        closeCropModal() {
            this.cropOpen = false;
            this.cropImageSrc = '';
            this.revokeCropObjectUrl();
            this.resetFileInput();
        },
        onFileSelected(event) {
            const file = event.target.files?.[0];
            this.resetFileInput();

            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showAppAlert('Image must be 5 MB or smaller.');
                return;
            }

            this.revokeCropObjectUrl();
            this.cropObjectUrl = URL.createObjectURL(file);
            this.cropImageSrc = this.cropObjectUrl;
            this.cropOpen = true;
        },
        async onCropConfirm(blob) {
            if (!blob) return;

            this.setLocalPreview(blob);
            this.closeCropModal();
            await this.$nextTick();

            if (!this.projectId) {
                return;
            }

            try {
                await this.uploadLogoBlob(blob, this.projectId);
            } catch {
                // Keep local preview so the user can remove or pick another file.
            }
        },
        async uploadLogoBlob(blob, projectId) {
            this.uploading = true;
            this.uploadProgress = 0;
            try {
                const formData = new FormData();
                formData.append('logo', blob, 'logo.jpg');

                const res = await this.$api.post(`/projects/${projectId}/logo`, formData, {
                    onUploadProgress: (event) => {
                        if (!event.total) return;
                        this.uploadProgress = Math.min(99, Math.round((event.loaded / event.total) * 100));
                    },
                });
                const nextUrl = resolveMediaUrl(res.data.logo_url || '');

                this.uploadProgress = 100;
                this.previewFailed = false;
                this.logoCacheKey = Date.now();
                this.$emit('update:logoUrl', nextUrl);
                return nextUrl;
            } catch (err) {
                console.error('Error uploading property logo:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to upload property logo.'));
                throw err;
            } finally {
                this.uploading = false;
                this.uploadProgress = 0;
            }
        },
        async flushPendingUpload(projectId) {
            const id = projectId || this.projectId;
            if (!id || !this.pendingBlob) return '';

            return this.uploadLogoBlob(this.pendingBlob, id);
        },
        hasPendingUpload() {
            return Boolean(this.pendingBlob);
        },
        async removeLogo() {
            if (this.uploading) return;

            if (this.pendingBlob || this.pendingPreviewUrl) {
                this.clearPendingPreview({ emit: true });
                this.previewFailed = false;
                return;
            }

            if (!this.projectId || !String(this.logoUrl || '').trim()) return;

            this.removing = true;
            try {
                await this.$api.delete(`/projects/${this.projectId}/logo`);
                this.previewFailed = false;
                this.$emit('update:logoUrl', '');
            } catch (err) {
                console.error('Error removing property logo:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to remove property logo.'));
            } finally {
                this.removing = false;
            }
        },
    },
};
</script>
