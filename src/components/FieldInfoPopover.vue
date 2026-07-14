<template>
    <span class="field-info-popover">
        <button
            ref="trigger"
            type="button"
            class="field-info-popover__btn"
            :class="{ 'field-info-popover__btn--open': isOpen }"
            :aria-label="ariaLabel"
            :aria-expanded="isOpen ? 'true' : 'false'"
            @mouseenter="onHoverEnter"
            @mouseleave="onHoverLeave"
            @click.stop="onClick"
        >
            <i class="ti ti-info-circle" aria-hidden="true"></i>
        </button>
        <div
            v-show="isOpen"
            ref="panel"
            class="field-info-popover__panel"
            role="tooltip"
            :style="panelStyle"
            @mouseenter="onHoverEnter"
            @mouseleave="onHoverLeave"
            @click.stop
        >
            {{ text }}
        </div>
    </span>
</template>

<script>
export default {
    name: 'FieldInfoPopover',
    props: {
        text: {
            type: String,
            required: true,
        },
        ariaLabel: {
            type: String,
            default: 'More information',
        },
    },
    data() {
        return {
            pinned: false,
            hovering: false,
            hideTimer: null,
            panelStyle: null,
        };
    },
    computed: {
        isOpen() {
            return this.pinned || this.hovering;
        },
    },
    watch: {
        isOpen(value) {
            if (value) {
                this.$nextTick(() => this.positionPanel());
            } else {
                this.panelStyle = null;
            }
        },
    },
    mounted() {
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onDocumentKeydown);
        window.addEventListener('resize', this.positionPanel);
        window.addEventListener('scroll', this.positionPanel, true);
    },
    beforeUnmount() {
        this.clearHideTimer();
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onDocumentKeydown);
        window.removeEventListener('resize', this.positionPanel);
        window.removeEventListener('scroll', this.positionPanel, true);
    },
    methods: {
        clearHideTimer() {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
        },
        onHoverEnter() {
            this.clearHideTimer();
            this.hovering = true;
        },
        onHoverLeave() {
            if (this.pinned) return;

            this.clearHideTimer();
            this.hideTimer = setTimeout(() => {
                this.hovering = false;
                this.hideTimer = null;
            }, 120);
        },
        onClick() {
            this.pinned = !this.pinned;

            if (this.pinned) {
                this.clearHideTimer();
                this.hovering = true;
                return;
            }

            this.hovering = false;
        },
        close() {
            this.pinned = false;
            this.hovering = false;
            this.clearHideTimer();
            this.panelStyle = null;
        },
        positionPanel() {
            if (!this.isOpen) return;

            const trigger = this.$refs.trigger;
            const panel = this.$refs.panel;

            if (!trigger || !panel) return;

            const rect = trigger.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            const gap = 8;
            let top = rect.top - panelRect.height - gap;
            const viewportPadding = 12;

            if (top < viewportPadding) {
                top = rect.bottom + gap;
            }

            let left = rect.left + (rect.width / 2) - (panelRect.width / 2);
            const maxLeft = window.innerWidth - panelRect.width - viewportPadding;
            left = Math.max(viewportPadding, Math.min(left, maxLeft));

            this.panelStyle = {
                top: `${top}px`,
                left: `${left}px`,
            };
        },
        onDocumentClick(event) {
            if (!this.pinned) return;
            if (this.$el.contains(event.target)) return;
            this.close();
        },
        onDocumentKeydown(event) {
            if (this.isOpen && event.key === 'Escape') {
                this.close();
            }
        },
    },
};
</script>
