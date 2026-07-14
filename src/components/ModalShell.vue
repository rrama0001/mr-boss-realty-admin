<template>
    <div class="modal d-block modal-backdrop-custom" tabindex="-1" @click.self="onBackdropClick">
        <div
            class="modal-dialog modal-dialog-centered"
            :class="[dialogClass, { 'modal-dialog-scrollable': scrollable }]"
            role="document"
        >
            <div class="modal-content">
                <slot />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ModalShell',
    props: {
        size: {
            type: String,
            default: 'lg',
            validator: (value) => ['sm', 'md', 'lg', 'xl', ''].includes(value),
        },
        fullscreenSmDown: {
            type: Boolean,
            default: true,
        },
        closeOnBackdrop: {
            type: Boolean,
            default: false,
        },
        scrollable: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        dialogClass() {
            return {
                'modal-sm': this.size === 'sm',
                'modal-lg': this.size === 'lg',
                'modal-xl': this.size === 'xl',
                'modal-fullscreen-sm-down': this.fullscreenSmDown,
            };
        },
    },
    mounted() {
        this._previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    },
    beforeUnmount() {
        document.body.style.overflow = this._previousBodyOverflow || '';
    },
    methods: {
        onBackdropClick() {
            if (this.closeOnBackdrop) {
                this.$emit('backdrop-click');
            }
        },
    },
};
</script>
