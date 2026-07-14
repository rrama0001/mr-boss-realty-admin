<template>
    <Teleport to="body">
        <div v-if="visible" class="image-crop-modal">
            <ModalShell size="lg" :scrollable="false" close-on-backdrop @backdrop-click="cancel">
                <div class="modal-header">
                    <h5 class="modal-title">{{ title }}</h5>
                    <button type="button" class="btn-close" aria-label="Close" @click="cancel"></button>
                </div>
                <div class="modal-body image-crop-modal__body">
                    <p class="text-secondary small mb-3">
                        {{ helpText }}
                    </p>
                    <div class="image-crop-modal__stage">
                        <img
                            ref="imageEl"
                            :src="imageSrc"
                            alt="Crop preview"
                            class="image-crop-modal__image"
                            @error="onImageError"
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" :disabled="processing" @click="cancel">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" :disabled="processing || !cropperReady" @click="apply">
                        {{ applyButtonLabel }}
                    </button>
                </div>
            </ModalShell>
        </div>
    </Teleport>
</template>

<script>
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import ModalShell from '@/components/ModalShell.vue';

const OUTPUT_SIZE = 512;

export default {
    name: 'ImageCropModal',
    components: { ModalShell },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
        imageSrc: {
            type: String,
            default: '',
        },
        title: {
            type: String,
            default: 'Crop property logo',
        },
        helpText: {
            type: String,
            default: 'Drag to reposition. The logo is cropped to a square for the public property page.',
        },
        aspectRatio: {
            type: Number,
            default: 1,
        },
        freeAspect: {
            type: Boolean,
            default: false,
        },
        outputWidth: {
            type: Number,
            default: OUTPUT_SIZE,
        },
        outputHeight: {
            type: Number,
            default: null,
        },
        confirmLabel: {
            type: String,
            default: '',
        },
    },
    emits: ['cancel', 'confirm'],
    data() {
        return {
            cropper: null,
            cropperReady: false,
            processing: false,
        };
    },
    computed: {
        cropOutputHeight() {
            return this.outputHeight || this.outputWidth;
        },
        applyButtonLabel() {
            if (this.processing) {
                return 'Uploading...';
            }

            return this.confirmLabel || 'Apply & upload';
        },
    },
    watch: {
        visible(value) {
            if (!value) {
                this.processing = false;
                this.destroyCropper();
                return;
            }

            this.scheduleInitCropper();
        },
        imageSrc() {
            if (this.visible) {
                this.scheduleInitCropper();
            }
        },
    },
    beforeUnmount() {
        this.destroyCropper();
    },
    methods: {
        scheduleInitCropper() {
            this.destroyCropper();

            this.$nextTick(() => {
                this.$nextTick(() => {
                    window.requestAnimationFrame(() => this.initCropper());
                });
            });
        },
        initCropper() {
            this.destroyCropper();

            const imageEl = this.$refs.imageEl;
            if (!imageEl || !this.imageSrc) return;

            const start = () => {
                if (!this.visible || !this.$refs.imageEl) return;

                const target = this.$refs.imageEl;
                if (!target.naturalWidth || !target.naturalHeight) {
                    alert('Could not load the image for cropping.');
                    this.$emit('cancel');
                    return;
                }

                try {
                    this.cropper = new Cropper(target, {
                        ...this.buildCropperOptions(),
                        ready: () => {
                            this.cropperReady = true;
                        },
                    });
                } catch (err) {
                    console.error('Cropper init failed:', err);
                    alert('Failed to open the crop tool. Please try again.');
                    this.$emit('cancel');
                }
            };

            if (imageEl.complete) {
                start();
                return;
            }

            imageEl.onload = () => {
                imageEl.onload = null;
                start();
            };
        },
        onImageError() {
            alert('Could not load the image for cropping.');
            this.$emit('cancel');
        },
        buildCropperOptions() {
            if (this.freeAspect) {
                return {
                    aspectRatio: NaN,
                    viewMode: 0,
                    dragMode: 'none',
                    autoCropArea: 0.96,
                    responsive: true,
                    restore: false,
                    background: false,
                    modal: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    zoomOnWheel: true,
                    wheelZoomRatio: 0.1,
                    movable: false,
                    zoomable: true,
                    scalable: false,
                };
            }

            return {
                aspectRatio: this.aspectRatio,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.92,
                responsive: true,
                background: false,
                modal: false,
                guides: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
            };
        },
        destroyCropper() {
            this.cropperReady = false;

            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }
        },
        cancel() {
            if (this.processing) return;
            this.$emit('cancel');
        },
        getCroppedBlob() {
            return new Promise((resolve, reject) => {
                if (!this.cropper) {
                    reject(new Error('Cropper is not ready.'));
                    return;
                }

                const canvasOptions = {
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                };

                if (!this.freeAspect) {
                    canvasOptions.width = this.outputWidth;
                    canvasOptions.height = this.cropOutputHeight;
                }

                const canvas = this.cropper.getCroppedCanvas(canvasOptions);

                if (!canvas) {
                    reject(new Error('Could not crop image.'));
                    return;
                }

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Could not prepare cropped image.'));
                            return;
                        }
                        resolve(blob);
                    },
                    'image/jpeg',
                    0.92,
                );
            });
        },
        async apply() {
            if (this.processing) return;

            this.processing = true;
            try {
                const blob = await this.getCroppedBlob();
                this.$emit('confirm', blob);
            } catch (err) {
                console.error(err);
                alert(err.message || 'Failed to crop image.');
            } finally {
                this.processing = false;
            }
        },
    },
};
</script>
