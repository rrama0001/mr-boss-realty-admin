<template>
    <div class="dashboard-page">
        <PageHeader title="Dashboard" subtitle="Welcome back to Mr. Boss Realty." />

        <div class="row row-deck row-cards g-3">
            <div v-for="card in visibleCards" :key="card.label" class="col-sm-6 col-lg-4">
                <StatCard
                    :label="card.label"
                    :value="card.value"
                    :hint="card.hint"
                    :icon="card.icon"
                    :icon-tone="card.iconTone"
                    :to="card.to"
                />
            </div>
        </div>
    </div>
</template>

<script>
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/layout/StatCard.vue'

export default {
    name: 'DashboardPage',
    components: { PageHeader, StatCard },
    data() {
        return {
            leadStats: null,
            leadStatsLoading: false,
        }
    },
    computed: {
        isAdmin() {
            return localStorage.getItem('userRole') === 'admin'
        },
        cards() {
            return [
                {
                    label: 'Properties',
                    value: 'Manage',
                    hint: 'Developers and real estate properties',
                    icon: 'ti ti-building-estate',
                    iconTone: 'orange',
                    to: '/properties',
                },
                {
                    label: 'Units',
                    value: 'Browse',
                    hint: 'Available inventory and pricing',
                    icon: 'ti ti-building',
                    iconTone: 'cyan',
                    to: '/units',
                },
                {
                    label: 'Leads',
                    value: this.leadsCardValue,
                    hint: this.leadsCardHint,
                    icon: 'ti ti-address-book',
                    iconTone: 'green',
                    to: '/leads',
                    adminOnly: true,
                },
                {
                    label: 'Settings',
                    value: 'Configure',
                    hint: this.isAdmin ? 'AI assistant, users, and app options' : 'AI assistant and app options',
                    icon: 'ti ti-settings',
                    iconTone: 'slate',
                    to: '/settings',
                },
            ]
        },
        visibleCards() {
            return this.cards.filter((card) => !card.adminOnly || this.isAdmin)
        },
        leadsCardValue() {
            if (this.leadStatsLoading) return '…'
            if (!this.leadStats) return '—'
            return this.leadStats.total
        },
        leadsCardHint() {
            if (!this.leadStats) {
                return 'Verified contacts from website AI chat'
            }

            const { total } = this.leadStats
            return total === 1 ? '1 verified lead' : `${total} verified leads`
        },
    },
    async created() {
        if (this.isAdmin) {
            await this.loadLeadStats()
        }
    },
    methods: {
        async loadLeadStats() {
            this.leadStatsLoading = true

            try {
                const res = await this.$api.get('/leads/stats')
                this.leadStats = {
                    total: Number(res.data?.total) || 0,
                }
            } catch (err) {
                console.error('Error loading lead stats:', err.response?.data || err)
                this.leadStats = null
            } finally {
                this.leadStatsLoading = false
            }
        },
    },
}
</script>
