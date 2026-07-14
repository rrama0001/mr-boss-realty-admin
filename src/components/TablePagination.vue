<template>
    <div
        v-if="total > 0"
        :class="[
            'table-pagination d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2',
            { 'table-pagination--embedded': embedded },
        ]"
    >
        <div class="text-muted small">
            Showing {{ rangeFrom }}–{{ rangeTo }} of {{ total }}
        </div>
        <ul v-if="lastPage > 1" class="pagination mb-0">
            <li class="page-item" :class="{ disabled: currentPage <= 1 }">
                <button type="button" class="page-link" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
                    Previous
                </button>
            </li>
            <li
                v-for="pageNumber in visiblePages"
                :key="pageNumber"
                class="page-item"
                :class="{ active: pageNumber === currentPage }"
            >
                <button type="button" class="page-link" @click="changePage(pageNumber)">
                    {{ pageNumber }}
                </button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage >= lastPage }">
                <button
                    type="button"
                    class="page-link"
                    :disabled="currentPage >= lastPage"
                    @click="changePage(currentPage + 1)"
                >
                    Next
                </button>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'TablePagination',
    props: {
        meta: {
            type: Object,
            default: () => ({}),
        },
        embedded: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        currentPage() {
            return this.meta.current_page || 1;
        },
        lastPage() {
            return this.meta.last_page || 1;
        },
        total() {
            return this.meta.total || 0;
        },
        perPage() {
            return this.meta.per_page || 25;
        },
        rangeFrom() {
            if (!this.total) return 0;
            return (this.currentPage - 1) * this.perPage + 1;
        },
        rangeTo() {
            return Math.min(this.currentPage * this.perPage, this.total);
        },
        visiblePages() {
            const pages = [];
            const delta = 2;
            const start = Math.max(1, this.currentPage - delta);
            const end = Math.min(this.lastPage, this.currentPage + delta);

            for (let page = start; page <= end; page += 1) {
                pages.push(page);
            }

            return pages;
        },
    },
    methods: {
        changePage(page) {
            if (page < 1 || page > this.lastPage || page === this.currentPage) return;
            this.$emit('page-change', page);
        },
    },
};
</script>
