<template>
    <th
        class="sortable-th"
        :class="{ 'sortable-th--active': active, 'text-end': align === 'end' }"
        :aria-sort="ariaSort"
    >
        <button type="button" class="sortable-th__btn" @click="$emit('sort')">
            <span>{{ label }}</span>
            <i class="sortable-th__icon ti" :class="iconClass" aria-hidden="true"></i>
        </button>
    </th>
</template>

<script>
export default {
    name: 'SortableTh',
    props: {
        label: {
            type: String,
            required: true,
        },
        active: {
            type: Boolean,
            default: false,
        },
        direction: {
            type: String,
            default: 'asc',
            validator: (value) => ['asc', 'desc'].includes(value),
        },
        align: {
            type: String,
            default: 'start',
            validator: (value) => ['start', 'end'].includes(value),
        },
    },
    emits: ['sort'],
    computed: {
        ariaSort() {
            if (!this.active) return 'none';
            return this.direction === 'desc' ? 'descending' : 'ascending';
        },
        iconClass() {
            if (!this.active) return 'ti-selector';
            return this.direction === 'desc' ? 'ti-chevron-down' : 'ti-chevron-up';
        },
    },
};
</script>
