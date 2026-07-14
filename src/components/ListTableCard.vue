<template>
    <div class="card list-table-card">
        <div v-if="$slots.header" class="card-header">
            <slot name="header" />
        </div>

        <div v-if="$slots.filters" class="card-body border-bottom list-table-card__filters">
            <slot name="filters" />
        </div>

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading…</span>
            </div>
        </div>

        <ResponsiveTable v-else>
            <slot />
        </ResponsiveTable>

        <div v-if="!loading && $slots.footer" class="card-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

<script>
import ResponsiveTable from '@/components/ResponsiveTable.vue'

export default {
    name: 'ListTableCard',
    components: { ResponsiveTable },
    props: {
        loading: {
            type: Boolean,
            default: false,
        },
    },
}
</script>
