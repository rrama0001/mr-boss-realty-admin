<template>
    <div class="property-logo-upload">
        <LabelWithInfo label="Property Logo" :help="help" />

        <div v-if="!projectId" class="text-secondary small">
            Save the property first, then upload a logo.
        </div>

        <template v-else>
            <div class="property-logo-upload__preview-wrap">
                <div class="property-logo-upload__preview" :class="{ 'property-logo-upload__preview--empty': !displayUrl }">
                    <img
                        v-if="displayUrl && !previewFailed"
                        :src="resolvedLogoUrl"
                        alt="Property logo preview"
                        class="property-logo-upload__image"
                        @error="previewFailed = true"
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
            <div v-else class="text-secondary small mt-2">
                JPG, PNG, WebP, or GIF. Max 5 MB. Cropped to a square before upload.
            </div>
        </template>

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
            help: PROJECT_FIELD_HELP.property_logo,
            cropOpen: false,
            cropImageSrc: '',
            cropObjectUrl: null,
        };
    },
    computed: {
        displayUrl() {
            return String(this.logoUrl || '').trim();
        },
        resolvedLogoUrl() {
            return resolveMediaUrl(this.displayUrl);
        },
    },
    watch: {
        logoUrl() {
            this.previewFailed = false;
        },
    },
    beforeUnmount() {
        this.revokeCropObjectUrl();
    },
    methods: {
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
        closeCropModal() {
            this.cropOpen = false;
            this.cropImageSrc = '';
            this.revokeCropObjectUrl();
            this.resetFileInput();
        },
        onFileSelected(event) {
            const file = event.target.files?.[0];
            this.resetFileInput();

            if (!file || !this.projectId) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be 5 MB or smaller.');
                return;
            }

            this.revokeCropObjectUrl();
            this.cropObjectUrl = URL.createObjectURL(file);
            this.cropImageSrc = this.cropObjectUrl;
            this.cropOpen = true;
        },
        async onCropConfirm(blob) {
            if (!this.projectId || !blob) return;

            this.uploading = true;
            try {
                const formData = new FormData();
                formData.append('logo', blob, 'logo.jpg');

                const res = await this.$api.post(`/projects/${this.projectId}/logo`, formData);

                this.previewFailed = false;
                this.$emit('update:logoUrl', res.data.logo_url || '');
                this.closeCropModal();
            } catch (err) {
                console.error('Error uploading property logo:', err.response?.data || err);
                alert(err.response?.data?.error || 'Failed to upload property logo.');
            } finally {
                this.uploading = false;
            }
        },
        async removeLogo() {
            if (!this.projectId || !this.displayUrl) return;

            this.removing = true;
            try {
                await this.$api.delete(`/projects/${this.projectId}/logo`);
                this.previewFailed = false;
                this.$emit('update:logoUrl', '');
            } catch (err) {
                console.error('Error removing property logo:', err.response?.data || err);
                alert(err.response?.data?.error || 'Failed to remove property logo.');
            } finally {
                this.removing = false;
            }
        },
    },
};
</script>
