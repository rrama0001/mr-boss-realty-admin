<template>
    <div class="leads-page">
        <PageHeader title="Leads" subtitle="Verified contacts from website AI chat and OTP." />

        <ListTableCard>
            <template #filters>
                <TableFiltersBar>
                    <input
                        v-model="searchQuery"
                        type="search"
                        class="form-control table-filters-bar__search"
                        placeholder="Search leads..."
                        @input="onFiltersChange"
                    />
                </TableFiltersBar>
            </template>

            <table class="table table-vcenter table-hover card-table mb-0">
                <thead>
                    <tr>
                        <th v-for="field in listFields" :key="field.key">{{ field.label }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="item in paginatedLeads"
                        :key="item.id"
                        :class="{ 'table-row--highlighted': isRecordHighlighted(item.id) }"
                        :data-record-id="item.id"
                    >
                        <td v-for="field in listFields" :key="field.key">
                            <a
                                v-if="field.key === 'contact' && item.contact_tel"
                                :href="item.contact_tel"
                                class="text-reset"
                            >
                                {{ item.contact }}
                            </a>
                            <span v-else>{{ displayValue(item, field.key) }}</span>
                        </td>
                        <td class="text-end">
                            <TableActionsDropdown>
                                <button type="button" class="dropdown-item" @click="openViewLeadModal(item)">
                                    View Details
                                </button>
                            </TableActionsDropdown>
                        </td>
                    </tr>
                    <tr v-if="!filteredLeads.length">
                        <td :colspan="listFields.length + 1" class="text-center text-secondary py-4">
                            No leads found.
                        </td>
                    </tr>
                </tbody>
            </table>

            <template #footer>
                <TablePagination embedded :meta="paginationMeta" @page-change="goToPage" />
            </template>
        </ListTableCard>

        <ModalShell v-if="showLeadModal">
            <div class="modal-header">
                <h5 class="modal-title">{{ leadModalTitle }}</h5>
                <button type="button" class="btn-close" aria-label="Close" @click="closeLeadModal"></button>
            </div>
            <div class="modal-body">
                <dl class="row mb-0 record-detail-list">
                    <template v-for="field in detailFields" :key="field.key">
                        <dt class="col-sm-4">{{ field.label }}</dt>
                        <dd class="col-sm-8">
                            <a
                                v-if="field.key === 'contact' && activeLead?.contact_tel"
                                :href="activeLead.contact_tel"
                            >
                                {{ activeLead.contact }}
                            </a>
                            <span v-else>{{ displayDetailValue(field.key, activeLead?.[field.key]) }}</span>
                        </dd>
                    </template>
                </dl>
            </div>
            <div class="modal-footer">
                <a
                    v-if="activeLead?.contact_tel"
                    :href="activeLead.contact_tel"
                    class="btn btn-primary"
                >
                    <i class="ti ti-phone me-1"></i> Call
                </a>
                <button type="button" class="btn btn-secondary" @click="closeLeadModal">Close</button>
            </div>
        </ModalShell>
    </div>
</template>

<script>
import PageHeader from '@/components/layout/PageHeader.vue';
import ListTableCard from '@/components/ListTableCard.vue';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableActionsDropdown from '@/components/TableActionsDropdown.vue';
import TablePagination from '@/components/TablePagination.vue';
import ModalShell from '@/components/ModalShell.vue';
import recordHighlight from '@/mixins/recordHighlight';

const PER_PAGE = 20;

const LIST_FIELDS = [
    { key: 'verified_at', label: 'Verified' },
    { key: 'contact', label: 'Contact' },
    { key: 'inquiry_message', label: 'Inquiry' },
    { key: 'property_label', label: 'Property' },
];

const DETAIL_FIELDS = [
    { key: 'contact', label: 'Contact' },
    { key: 'inquiry_message', label: 'Inquiry Message' },
    { key: 'property_label', label: 'Property' },
    { key: 'building_ref', label: 'Building Ref' },
    { key: 'unit_ref', label: 'Unit Ref' },
    { key: 'source', label: 'Source' },
    { key: 'verified_at', label: 'Verified At' },
    { key: 'created_at', label: 'Created At' },
];

export default {
    name: 'LeadsPage',
    components: {
        PageHeader,
        ListTableCard,
        TableFiltersBar,
        TableActionsDropdown,
        TablePagination,
        ModalShell,
    },
    mixins: [recordHighlight],
    data() {
        return {
            leadsList: [],
            filteredLeads: [],
            searchQuery: '',
            listFields: LIST_FIELDS,
            detailFields: DETAIL_FIELDS,
            currentPage: 1,
            perPage: PER_PAGE,
            showLeadModal: false,
            activeLead: null,
            activeModalRecordId: null,
        };
    },
    computed: {
        paginatedLeads() {
            if (!this.filteredLeads.length) return [];
            const start = (this.paginationMeta.current_page - 1) * this.perPage;
            return this.filteredLeads.slice(start, start + this.perPage);
        },
        paginationMeta() {
            const total = this.filteredLeads.length;
            const last_page = total ? Math.ceil(total / this.perPage) : 1;
            const current_page = Math.min(this.currentPage, last_page);

            return {
                current_page,
                last_page,
                total,
                per_page: this.perPage,
            };
        },
        leadModalTitle() {
            if (!this.activeLead) return 'Lead Details';
            return this.activeLead.contact || `Lead #${this.activeLead.id}`;
        },
    },
    async created() {
        await this.loadLeads();
    },
    methods: {
        formatDate(value) {
            if (!value) return '—';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return '—';
            return date.toLocaleString();
        },
        truncateText(value, max = 80) {
            const text = String(value || '').trim();
            if (!text) return '—';
            if (text.length <= max) return text;
            return `${text.slice(0, max - 1)}…`;
        },
        displayValue(item, key) {
            if (key === 'verified_at') return this.formatDate(item.verified_at || item.created_at);
            if (key === 'inquiry_message') return this.truncateText(item.inquiry_message);
            if (key === 'property_label') {
                return item.property_label || item.building_ref || item.unit_ref || '—';
            }
            return item[key] || '—';
        },
        displayDetailValue(key, value) {
            if (key === 'verified_at' || key === 'created_at') {
                return this.formatDate(value);
            }
            if (value === '' || value == null) return '—';
            return value;
        },
        async loadLeads() {
            try {
                const res = await this.$api.get('/leads');
                this.leadsList = Array.isArray(res.data) ? res.data : [];
                this.applyLeadFilters();
            } catch (err) {
                console.error('Error loading leads:', err.response?.data || err);
            }
        },
        onFiltersChange() {
            this.currentPage = 1;
            this.applyLeadFilters();
        },
        goToPage(page) {
            this.currentPage = page;
        },
        clampCurrentPage() {
            const lastPage = this.paginationMeta.last_page;
            if (this.currentPage > lastPage) {
                this.currentPage = lastPage;
            }
            if (this.currentPage < 1) {
                this.currentPage = 1;
            }
        },
        applyLeadFilters() {
            let results = this.leadsList;
            const query = this.searchQuery.trim().toLowerCase();

            if (query) {
                results = results.filter((lead) => this.matchesSearch(lead, query));
            }

            this.filteredLeads = results;
            this.clampCurrentPage();
        },
        matchesSearch(lead, query) {
            return [
                lead.contact,
                lead.inquiry_message,
                lead.property_label,
                lead.building_ref,
                lead.unit_ref,
            ].some((value) => String(value || '').toLowerCase().includes(query));
        },
        openViewLeadModal(lead) {
            this.activeLead = { ...lead };
            this.activeModalRecordId = lead.id;
            this.showLeadModal = true;
            this.highlightRecord(lead.id);
        },
        closeLeadModal() {
            this.showLeadModal = false;
            this.activeLead = null;
            this.clearRecordHighlight(this.activeModalRecordId);
            this.activeModalRecordId = null;
        },
    },
};
</script>
