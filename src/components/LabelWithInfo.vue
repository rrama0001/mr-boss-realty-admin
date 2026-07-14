<template>
    <component
        :is="tag"
        :for="forAttr || undefined"
        :class="rootClass"
    >
        <span v-if="label" class="label-with-info__label">{{ label }}</span>
        <slot />
        <FieldInfoPopover v-if="help" :text="help" />
    </component>
</template>

<script>
import FieldInfoPopover from '@/components/FieldInfoPopover.vue';

export default {
    name: 'LabelWithInfo',
    components: { FieldInfoPopover },
    props: {
        label: {
            type: String,
            default: '',
        },
        help: {
            type: String,
            default: '',
        },
        forAttr: {
            type: String,
            default: '',
        },
        tag: {
            type: String,
            default: 'label',
        },
        baseClass: {
            type: String,
            default: 'form-label',
        },
        inline: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        rootClass() {
            return [
                this.baseClass,
                this.inline ? 'label-with-info' : null,
            ].filter(Boolean);
        },
    },
};
</script>
