<template>
    <div class="dashboard-page">
        <PageHeader title="Dashboard" subtitle="Inventory, pipeline, and inquiry pulse at a glance." />

        <div v-if="loading" class="dashboard-loading text-secondary">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading dashboard…
        </div>

        <template v-else-if="loadError">
            <div class="alert alert-danger" role="alert">
                {{ loadError }}
            </div>
        </template>

        <template v-else>
            <div class="row row-deck row-cards g-3 mb-3">
                <div v-for="card in kpiCards" :key="card.label" class="col-sm-6 col-xl-3">
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

            <div class="row row-deck row-cards g-3">
                <div v-if="isAdmin && leadsChartData" class="col-lg-7">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Inquiries (last 30 days)</h3>
                        </div>
                        <div class="card-body dashboard-chart-body">
                            <Line :data="leadsChartData" :options="lineChartOptions" />
                        </div>
                    </div>
                </div>

                <div :class="isAdmin ? 'col-lg-5' : 'col-lg-4'">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Units by listing</h3>
                        </div>
                        <div class="card-body dashboard-chart-body dashboard-chart-body--doughnut">
                            <Doughnut
                                v-if="listingTypeChartData"
                                :data="listingTypeChartData"
                                :options="doughnutOptions"
                            />
                            <p v-else class="text-secondary mb-0">No units yet.</p>
                        </div>
                    </div>
                </div>

                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">AI token usage (last 30 days)</h3>
                            <div v-if="aiUsageSummary" class="card-actions text-secondary small">
                                {{ aiUsageSummary }}
                            </div>
                        </div>
                        <div class="card-body dashboard-chart-body">
                            <Line
                                v-if="aiTokenChartData"
                                :data="aiTokenChartData"
                                :options="tokenLineChartOptions"
                            />
                            <p v-else class="text-secondary mb-0">
                                No AI token usage recorded yet. Usage appears after website chat replies.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Property status</h3>
                        </div>
                        <div class="card-body dashboard-chart-body">
                            <Bar
                                v-if="projectStatusChartData"
                                :data="projectStatusChartData"
                                :options="barChartOptions"
                            />
                            <p v-else class="text-secondary mb-0">No properties yet.</p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Units by type</h3>
                        </div>
                        <div class="card-body dashboard-chart-body">
                            <Bar
                                v-if="unitTypeChartData"
                                :data="unitTypeChartData"
                                :options="horizontalBarOptions"
                            />
                            <p v-else class="text-secondary mb-0">No units yet.</p>
                        </div>
                    </div>
                </div>

                <div v-if="isAdmin" class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Recent inquiries</h3>
                            <div class="card-actions">
                                <router-link to="/leads" class="btn btn-sm btn-outline-primary">
                                    View all
                                </router-link>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-vcenter card-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Property</th>
                                        <th>Inquiry</th>
                                        <th>When</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!recentLeads.length">
                                        <td colspan="4" class="text-secondary">No inquiries yet.</td>
                                    </tr>
                                    <tr v-for="lead in recentLeads" :key="lead.id">
                                        <td>
                                            <a
                                                v-if="lead.contact_tel"
                                                :href="lead.contact_tel"
                                                class="text-reset"
                                            >{{ lead.contact || '—' }}</a>
                                            <span v-else>{{ lead.contact || '—' }}</span>
                                        </td>
                                        <td class="text-secondary">{{ lead.property_label || '—' }}</td>
                                        <td class="text-secondary dashboard-inquiry-cell">
                                            {{ lead.inquiry_message || '—' }}
                                        </td>
                                        <td class="text-secondary text-nowrap">
                                            {{ formatRelativeDate(lead.verified_at || lead.created_at) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/layout/StatCard.vue'

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
)

const COLORS = {
    blue: '#066fd1',
    cyan: '#17a2b8',
    green: '#2fb344',
    orange: '#ff5a3c',
    amber: '#f59f00',
    slate: '#667382',
    red: '#d63939',
    teal: '#0ca678',
}

const LISTING_TYPE_COLORS = {
    sale: COLORS.blue,
    rent: COLORS.orange,
    unknown: COLORS.slate,
}

const DOUGHNUT_PALETTE = [COLORS.blue, COLORS.cyan, COLORS.orange, COLORS.green, COLORS.amber, COLORS.slate]
const BAR_PALETTE = [COLORS.orange, COLORS.blue, COLORS.teal, COLORS.amber, COLORS.cyan, COLORS.slate, COLORS.green]

function hasChartItems(items) {
    return Array.isArray(items) && items.some((item) => Number(item.count) > 0)
}

export default {
    name: 'DashboardPage',
    components: { PageHeader, StatCard, Bar, Doughnut, Line },
    data() {
        return {
            loading: true,
            loadError: '',
            stats: null,
            lineChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 0, autoSkipPadding: 12 },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(0, 0, 0, 0.06)' },
                    },
                },
            },
            tokenLineChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const value = Number(context.parsed?.y) || 0
                                return `${value.toLocaleString()} tokens`
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 0, autoSkipPadding: 12 },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            callback(value) {
                                return Number(value).toLocaleString()
                            },
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.06)' },
                    },
                },
            },
            doughnutOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 16 },
                    },
                },
                cutout: '62%',
            },
            barChartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        grid: { display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(0, 0, 0, 0.06)' },
                    },
                },
            },
            horizontalBarOptions: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(0, 0, 0, 0.06)' },
                    },
                    y: {
                        grid: { display: false },
                    },
                },
            },
        }
    },
    computed: {
        isAdmin() {
            return localStorage.getItem('userRole') === 'admin'
        },
        kpiCards() {
            const s = this.stats
            if (!s) return []

            const cards = [
                {
                    label: 'Properties',
                    value: s.projects.total,
                    hint: this.featuredHint(s.projects),
                    icon: 'ti ti-building-estate',
                    iconTone: 'orange',
                    to: '/properties',
                },
                {
                    label: 'Units',
                    value: s.units.total,
                    hint: `${s.units.forSale} sale · ${s.units.forRent} rent`,
                    icon: 'ti ti-building',
                    iconTone: 'cyan',
                    to: '/units',
                },
                {
                    label: 'Buildings',
                    value: s.buildings.total,
                    hint: this.availabilityHint(s.buildings),
                    icon: 'ti ti-building-community',
                    iconTone: 'blue',
                    to: '/properties',
                },
            ]

            if (this.isAdmin && s.leads) {
                cards.push({
                    label: 'Inquiries',
                    value: s.leads.total,
                    hint: s.leads.last7Days === 1
                        ? '1 new in the last 7 days'
                        : `${s.leads.last7Days} new in the last 7 days`,
                    icon: 'ti ti-address-book',
                    iconTone: 'green',
                    to: '/leads',
                })
            } else {
                cards.push({
                    label: 'Featured',
                    value: s.projects.featured,
                    hint: s.projects.privateOnWebsite
                        ? `${s.projects.privateOnWebsite} private on website`
                        : 'Highlighted on the website',
                    icon: 'ti ti-star',
                    iconTone: 'amber',
                    to: '/properties',
                })
            }

            return cards
        },
        recentLeads() {
            return this.stats?.leads?.recent || []
        },
        aiUsageSummary() {
            const usage = this.stats?.aiUsage
            if (!usage) return ''

            const total = Number(usage.totalTokens) || 0
            const last7 = Number(usage.last7DaysTokens) || 0
            const requests = Number(usage.totalRequests) || 0
            return `${total.toLocaleString()} tokens · ${last7.toLocaleString()} last 7 days · ${requests.toLocaleString()} replies`
        },
        leadsChartData() {
            const byDay = this.stats?.leads?.byDay
            if (!byDay?.length) return null

            return {
                labels: byDay.map((day) => this.formatChartDay(day.date)),
                datasets: [
                    {
                        label: 'Inquiries',
                        data: byDay.map((day) => day.count),
                        borderColor: COLORS.green,
                        backgroundColor: 'rgba(47, 179, 68, 0.14)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                    },
                ],
            }
        },
        aiTokenChartData() {
            const byDay = this.stats?.aiUsage?.byDay
            if (!byDay?.length) return null
            if (!byDay.some((day) => Number(day.tokens) > 0)) return null

            return {
                labels: byDay.map((day) => this.formatChartDay(day.date)),
                datasets: [
                    {
                        label: 'Tokens',
                        data: byDay.map((day) => Number(day.tokens) || 0),
                        borderColor: COLORS.blue,
                        backgroundColor: 'rgba(6, 111, 209, 0.14)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                    },
                ],
            }
        },
        listingTypeChartData() {
            const items = this.stats?.units?.byListingType
            if (!hasChartItems(items)) return null

            return {
                labels: items.map((item) => item.label),
                datasets: [
                    {
                        data: items.map((item) => item.count),
                        backgroundColor: items.map(
                            (item, index) => LISTING_TYPE_COLORS[item.key] || DOUGHNUT_PALETTE[index % DOUGHNUT_PALETTE.length],
                        ),
                        borderWidth: 0,
                    },
                ],
            }
        },
        projectStatusChartData() {
            const items = this.stats?.projects?.byStatus
            if (!hasChartItems(items)) return null

            return {
                labels: items.map((item) => item.label),
                datasets: [
                    {
                        data: items.map((item) => item.count),
                        backgroundColor: items.map((_, index) => BAR_PALETTE[index % BAR_PALETTE.length]),
                        borderRadius: 6,
                        maxBarThickness: 48,
                    },
                ],
            }
        },
        unitTypeChartData() {
            const items = this.stats?.units?.byUnitType
            if (!hasChartItems(items)) return null

            return {
                labels: items.map((item) => item.label),
                datasets: [
                    {
                        data: items.map((item) => item.count),
                        backgroundColor: items.map((_, index) => BAR_PALETTE[index % BAR_PALETTE.length]),
                        borderRadius: 6,
                        maxBarThickness: 28,
                    },
                ],
            }
        },
    },
    async created() {
        await this.loadStats()
    },
    methods: {
        async loadStats() {
            this.loading = true
            this.loadError = ''

            try {
                const res = await this.$api.get('/dashboard/stats')
                this.stats = res.data
            } catch (err) {
                console.error('Error loading dashboard stats:', err.response?.data || err)
                this.loadError = err.response?.data?.error || err.response?.data?.message || 'Failed to load dashboard.'
                this.stats = null
            } finally {
                this.loading = false
            }
        },
        featuredHint(projects) {
            const parts = []
            if (projects.featured) {
                parts.push(`${projects.featured} featured`)
            }
            if (projects.privateOnWebsite) {
                parts.push(`${projects.privateOnWebsite} private`)
            }
            return parts.length ? parts.join(' · ') : 'Developers and listings'
        },
        availabilityHint(buildings) {
            const units = buildings.availableUnitsReported
            const parking = buildings.availableParkingReported
            if (!units && !parking) {
                return 'Active buildings in inventory'
            }
            const parts = []
            if (units) parts.push(`${units} units reported available`)
            if (parking) parts.push(`${parking} parking`)
            return parts.join(' · ')
        },
        formatChartDay(isoDate) {
            const date = new Date(`${isoDate}T00:00:00Z`)
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
        },
        formatRelativeDate(value) {
            if (!value) return '—'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return '—'

            const diffMs = Date.now() - date.getTime()
            const diffMins = Math.round(diffMs / 60000)
            if (diffMins < 1) return 'Just now'
            if (diffMins < 60) return `${diffMins}m ago`
            const diffHours = Math.round(diffMins / 60)
            if (diffHours < 24) return `${diffHours}h ago`
            const diffDays = Math.round(diffHours / 24)
            if (diffDays < 14) return `${diffDays}d ago`

            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        },
    },
}
</script>

<style scoped>
.dashboard-loading {
    display: flex;
    align-items: center;
    min-height: 8rem;
}

.dashboard-chart-body {
    height: 280px;
}

.dashboard-chart-body--doughnut {
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dashboard-inquiry-cell {
    max-width: 28rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
