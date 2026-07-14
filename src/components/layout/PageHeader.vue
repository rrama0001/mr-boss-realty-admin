<template>
    <div :class="['page-header d-print-none', { 'page-header--has-actions': $slots.actions }]">
        <div class="row g-3 align-items-center">
            <div class="col">
                <router-link v-if="backTo" :to="backTo" class="page-back-link">
                    <i class="ti ti-arrow-left"></i> {{ backLabel }}
                </router-link>
                <h2 class="page-title">
                    <span
                        v-if="displayIcon"
                        :class="['page-title__icon', `page-title__icon--${displayIconTone}`]"
                        aria-hidden="true"
                    >
                        <i :class="displayIcon"></i>
                    </span>
                    <span>{{ title }}</span>
                </h2>
                <div v-if="subtitle" class="text-secondary mt-1">{{ subtitle }}</div>
            </div>
            <div v-if="$slots.actions" class="col-12 col-sm-auto ms-sm-auto d-print-none">
                <div class="page-header__actions">
                    <slot name="actions" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { navIconForPath, navIconToneForPath } from '@/config/navItems'

export default {
    name: 'PageHeader',
    props: {
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        backTo: { type: String, default: '' },
        backLabel: { type: String, default: 'Back' },
        icon: { type: String, default: '' },
        iconTone: { type: String, default: '' },
    },
    computed: {
        displayIcon() {
            return this.icon || navIconForPath(this.$route.path)
        },
        displayIconTone() {
            return this.iconTone || navIconToneForPath(this.$route.path)
        },
    },
}
</script>
