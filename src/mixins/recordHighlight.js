export default {
    data() {
        return {
            highlightedRecordId: null,
            highlightTimer: null,
        };
    },
    beforeUnmount() {
        this.clearRecordHighlight();
    },
    methods: {
        highlightRecord(id) {
            if (id == null || id === '') {
                return;
            }

            this.clearRecordHighlight();
            this.highlightedRecordId = id;

            this.$nextTick(() => {
                const row = this.$el.querySelector(`tr[data-record-id="${id}"]`);
                row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            });

            this.highlightTimer = setTimeout(() => {
                this.highlightedRecordId = null;
                this.highlightTimer = null;
            }, 4000);
        },
        isRecordHighlighted(id) {
            return String(this.highlightedRecordId) === String(id);
        },
        clearRecordHighlight() {
            if (this.highlightTimer) {
                clearTimeout(this.highlightTimer);
                this.highlightTimer = null;
            }
            this.highlightedRecordId = null;
        },
    },
};
