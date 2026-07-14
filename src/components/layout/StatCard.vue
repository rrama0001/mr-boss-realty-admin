<template>
    <component :is="to ? 'router-link' : 'div'" :to="to" class="card stat-card h-100 text-reset text-decoration-none">
        <div class="card-body">
            <div class="d-flex align-items-start gap-3">
                <div v-if="icon" :class="['stat-icon', iconTone ? `stat-icon--${iconTone}` : 'stat-icon--default']">
                    <i :class="icon"></i>
                </div>
                <div class="flex-fill min-w-0">
                    <div class="subheader mb-1">{{ label }}</div>
                    <div class="h1 mb-0">{{ value }}</div>
                    <div v-if="hint" class="text-secondary mt-1">{{ hint }}</div>
                </div>
            </div>
        </div>
    </component>
</template>

<script>
export default {
    name: 'StatCard',
    props: {
        label: { type: String, required: true },
        value: { type: [String, Number], default: '—' },
        hint: { type: String, default: '' },
        icon: { type: String, default: '' },
        to: { type: String, default: '' },
        iconTone: {
            type: String,
            default: '',
            validator: (value) =>
                !value || ['blue', 'cyan', 'purple', 'green', 'orange', 'red', 'indigo', 'amber', 'slate'].includes(value),
        },
    },
}
</script>
