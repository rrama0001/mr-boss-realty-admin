<template>
    <div class="property-logo-upload">
        <LabelWithInfo label="Property Logo" :help="help" />

        <div class="property-logo-upload__preview-wrap">
            <div class="property-logo-upload__preview" :class="{ 'property-logo-upload__preview--empty': !displayUrl }">
                <img
                    v-if="resolvedLogoUrl && !previewFailed"
                    :key="resolvedLogoUrl"
                    :src="resolvedLogoUrl"
                    alt="Property logo preview"
                    class="property-logo-upload__image"
                    @error="onPreviewError"
                    @load="previewFailed = false"
                />
                <div v-else class="property-logo-upload__placeholder text-secondary">
                    <i class="ti ti-photo" aria-hidden="true"></i>
                    <span>No logo uploaded</span>
                </div>
            </div>

            <div class="property-logo-upload__actions">
                <label class="btn btn-outline-primary btn-sm mb-0" :class="{ disabled: uploading || disabled || cropOpen }">
                    <i class="ti ti-upload me-1" aria-hidden="true"></i>
                    {{ displayUrl ? 'Replace logo' : 'Upload logo' }}
                    <input
                        ref="fileInput"
                        type="file"
                        class="property-logo-upload__file-input"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        :disabled="uploading || disabled || cropOpen"
                        @change="onFileSelected"
                    />
                </label>
                <button
                    v-if="displayUrl"
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    :disabled="uploading || removing || disabled || cropOpen"
                    @click="removeLogo"
                >
                    <i class="ti ti-trash me-1" aria-hidden="true"></i>
                    Remove
                </button>
            </div>
        </div>

        <div v-if="uploading || removing" class="text-secondary small mt-2">
            {{ uploading ? 'Uploading logo...' : 'Removing logo...' }}
        </div>
        <div v-else-if="pendingBlob && !projectId" class="text-secondary small mt-2">
            Logo will upload when you save the property. JPG, PNG, WebP, or GIF. Max 5 MB.
        </div>
        <div v-else class="text-secondary small mt-2">
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
            const sep = base.includes('?') ? '&' : '?';
            return this.logoCacheKey ? `${base}${sep}v=${this.logoCacheKey}` : base;
        },
    },
    watch: {
        logoUrl() {
            this.previewFailed = false;
        },
    },
    beforeUnmount() {
        this.revokeCropObjectUrl();
        this.clearPendingLogo({ emit: false });
    },
    methods: {
        onPreviewError() {
            this.previewFailed = true;
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
        clearPendingLogo({ emit = true } = {}) {
            if (this.pendingPreviewUrl) {
                URL.revokeObjectURL(this.pendingPreviewUrl);
            }
            this.pendingBlob = null;
            this.pendingPreviewUrl = null;
            if (emit) {
                this.$emit('update:logoUrl', '');
            }
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

            if (!this.projectId) {
                if (this.pendingPreviewUrl) {
                    URL.revokeObjectURL(this.pendingPreviewUrl);
                }
                this.pendingBlob = blob;
                this.pendingPreviewUrl = URL.createObjectURL(blob);
                this.previewFailed = false;
                this.logoCacheKey = Date.now();
                this.$emit('update:logoUrl', this.pendingPreviewUrl);
                this.closeCropModal();
                return;
            }

            await this.uploadLogoBlob(blob, this.projectId);
            this.closeCropModal();
        },
        async uploadLogoBlob(blob, projectId) {
            this.uploading = true;
            try {
                const formData = new FormData();
                formData.append('logo', blob, 'logo.jpg');

                const res = await this.$api.post(`/projects/${projectId}/logo`, formData);

                this.previewFailed = false;
                this.logoCacheKey = Date.now();
                this.$emit('update:logoUrl', resolveMediaUrl(res.data.logo_url || ''));
                return res.data.logo_url || '';
            } catch (err) {
                console.error('Error uploading property logo:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to upload property logo.'));
                throw err;
            } finally {
                this.uploading = false;
            }
        },
        async flushPendingUpload(projectId) {
            const id = projectId || this.projectId;
            if (!id || !this.pendingBlob) return '';

            const logoUrl = await this.uploadLogoBlob(this.pendingBlob, id);
            if (this.pendingPreviewUrl) {
                URL.revokeObjectURL(this.pendingPreviewUrl);
            }
            this.pendingBlob = null;
            this.pendingPreviewUrl = null;
            return logoUrl;
        },
        hasPendingUpload() {
            return Boolean(this.pendingBlob);
        },
        async removeLogo() {
            if (this.pendingBlob || this.pendingPreviewUrl) {
                this.clearPendingLogo();
                this.previewFailed = false;
                return;
            }

            if (!this.projectId || !this.displayUrl) return;

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
