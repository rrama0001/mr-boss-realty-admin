<template>
    <ModalShell v-if="modelValue" :size="size" close-on-backdrop @backdrop-click="close">
        <div class="modal-header">
            <h5 class="modal-title">{{ title }}</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="close"></button>
        </div>
        <div class="modal-body">
            <slot />
        </div>
        <div v-if="!hideFooter" class="modal-footer">
            <slot name="footer">
                <button type="button" class="btn btn-link link-secondary" @click="close">
                    {{ cancelTitle }}
                </button>
                <button type="button" class="btn btn-primary ms-auto" @click="$emit('ok')">
                    {{ okTitle }}
                </button>
            </slot>
        </div>
    </ModalShell>
</template>

<script>
import ModalShell from '@/components/ModalShell.vue';

export default {
    name: 'AppModal',
    components: { ModalShell },
    props: {
        modelValue: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            default: '',
        },
        size: {
            type: String,
            default: 'lg',
        },
        hideFooter: {
            type: Boolean,
            default: false,
        },
        okTitle: {
            type: String,
            default: 'Save',
        },
        cancelTitle: {
            type: String,
            default: 'Cancel',
        },
    },
    methods: {
        close() {
            this.$emit('update:modelValue', false);
            this.$emit('close');
        },
    },
};
</script>
