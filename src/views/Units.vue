<template>
    <div class="units-page">
        <PageHeader title="Available Units" />

        <ListTableCard>
            <template #filters>
                <TableFiltersBar>
                    <input
                        v-model="searchQuery"
                        type="search"
                        class="form-control table-filters-bar__search"
                        placeholder="Search units..."
                        @input="onSearchChange"
                    />
                    <select v-model="selectedProjectId" class="form-select" @change="onProjectFilterChange">
                        <option v-for="opt in projectFilterOptions" :key="String(opt.value)" :value="opt.value">
                            {{ opt.text }}
                        </option>
                    </select>
                    <select v-model="selectedListingType" class="form-select" @change="onListingTypeFilterChange">
                        <option v-for="opt in listingTypeFilterOptions" :key="String(opt.value)" :value="opt.value">
                            {{ opt.text }}
                        </option>
                    </select>
                    <select v-model="selectedUnitType" class="form-select" @change="onUnitTypeFilterChange">
                        <option v-for="opt in unitTypeFilterOptions" :key="String(opt.value)" :value="opt.value">
                            {{ opt.text }}
                        </option>
                    </select>
                </TableFiltersBar>
            </template>

            <table class="table table-vcenter table-hover card-table mb-0">
                <thead>
                    <tr>
                        <SortableTh
                            v-for="field in listFields"
                            :key="field.key"
                            :label="field.label"
                            :active="sortBy === field.key"
                            :direction="sortDir"
                            @sort="onSort(field.key)"
                        />
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="item in paginatedUnits"
                        :key="item.id"
                        :class="{ 'table-row--highlighted': isRecordHighlighted(item.id) }"
                        :data-record-id="item.id"
                    >
                        <td
                            v-for="field in listFields"
                            :key="field.key"
                            :class="{ 'table-price': field.key === 'unit_price' }"
                        >{{ displayValue(item, field.key) }}</td>
                        <td class="text-end">
                            <TableActionsDropdown>
                                <button type="button" class="dropdown-item" @click="openViewUnitModal(item)">
                                    View Info
                                </button>
                                <button type="button" class="dropdown-item text-danger" @click="deleteUnit(item)">
                                    Delete
                                </button>
                            </TableActionsDropdown>
                        </td>
                    </tr>
                    <tr v-if="!paginatedUnits.length">
                        <td :colspan="listFields.length + 1" class="text-center text-secondary py-4">
                            No units found.
                        </td>
                    </tr>
                </tbody>
            </table>

            <template #footer>
                <TablePagination embedded :meta="paginationMeta" @page-change="goToPage" />
            </template>
        </ListTableCard>

        <ModalShell v-if="showUnitModal">
                <template v-if="isViewMode">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ unitModalTitle }}</h5>
                            <button type="button" class="btn-close" aria-label="Close" @click="closeUnitModal"></button>
                        </div>
                        <div class="modal-body">
                            <dl class="row mb-0 record-detail-list">
                                <dt class="col-sm-4">Reference ID</dt>
                                <dd class="col-sm-8">{{ unitReferenceId || '—' }}</dd>
                                <dt class="col-sm-4">Listing type</dt>
                                <dd class="col-sm-8">{{ formatUnitListingType(unitForm.listing_type) }}</dd>
                                <dt class="col-sm-4">{{ unitForm.listing_type === 'rent' ? 'Rental rates' : 'Sale price' }}</dt>
                                <dd class="col-sm-8">{{ unitListingPriceDisplay }}</dd>
                                <template v-for="field in detailFields" :key="field.key">
                                    <dt class="col-sm-4">{{ field.label }}</dt>
                                    <dd class="col-sm-8">
                                        <a
                                            v-if="field.type === 'url' && unitForm[field.key]"
                                            :href="unitForm[field.key]"
                                            target="_blank"
                                            rel="noopener"
                                        >{{ unitForm[field.key] }}</a>
                                        <a
                                            v-else-if="field.key === 'website_url' && publicUnitUrl"
                                            :href="publicUnitUrl"
                                            target="_blank"
                                            rel="noopener"
                                        >{{ publicUnitUrl }}</a>
                                        <span v-else-if="field.key === 'website_url'">Generated after save when property has a website slug</span>
                                        <span v-else-if="field.key === 'payment_terms'">{{ formatPaymentTermsDisplay(unitForm.payment_terms) }}</span>
                                        <div v-else-if="field.key === 'unit_photos'" class="property-gallery-upload__grid">
                                            <figure
                                                v-for="(url, index) in unitForm.asset_image_urls"
                                                :key="`${url}-${index}`"
                                                class="property-gallery-upload__item"
                                            >
                                                <img :src="resolveUnitPhotoUrl(url)" alt="" class="property-gallery-upload__image" />
                                            </figure>
                                            <span v-if="!unitForm.asset_image_urls.length">—</span>
                                        </div>
                                        <span v-else-if="field.type === 'textarea'" class="unit-detail-text">{{ displayDetailValue(field, unitForm[field.key]) }}</span>
                                        <span v-else>{{ displayDetailValue(field, unitForm[field.key]) }}</span>
                                    </dd>
                                </template>
                            </dl>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeUnitModal">Close</button>
                            <button type="button" class="btn btn-primary" @click="enableUnitEdit">Edit</button>
                        </div>
                    </template>
                    <form v-else @submit.prevent="saveUnit">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ unitModalTitle }}</h5>
                            <button type="button" class="btn-close" aria-label="Close" @click="closeUnitModal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div
                                    v-for="field in detailFields"
                                    :key="field.key"
                                    :class="fieldColClass(field)"
                                >
                                    <LabelWithInfo
                                        v-if="field.key !== 'unit_photos'"
                                        :label="field.label"
                                        :help="field.help || ''"
                                    />
                                    <select
                                        v-if="field.key === 'project_id'"
                                        v-model="unitForm.project_id"
                                        class="form-select"
                                        required
                                        @change="onProjectChange"
                                    >
                                        <option disabled :value="null">Select property</option>
                                        <option v-for="opt in projectOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.text }}
                                        </option>
                                    </select>
                                    <select
                                        v-else-if="field.key === 'building_id'"
                                        v-model="unitForm.building_id"
                                        class="form-select"
                                        required
                                    >
                                        <option disabled :value="null">Select building</option>
                                        <option v-for="opt in buildingOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.text }}
                                        </option>
                                    </select>
                                    <select
                                        v-else-if="field.key === 'unit_type'"
                                        v-model="unitForm.unit_type"
                                        class="form-select"
                                        required
                                    >
                                        <option disabled value="">Select unit type</option>
                                        <option v-for="name in unitTypeOptions" :key="name" :value="name">
                                            {{ name }}
                                        </option>
                                        <option
                                            v-if="unitForm.unit_type && !isKnownUnitType(unitForm.unit_type)"
                                            :value="unitForm.unit_type"
                                        >
                                            {{ unitForm.unit_type }} (current)
                                        </option>
                                    </select>
                                    <select
                                        v-else-if="field.type === 'boolean'"
                                        v-model="unitForm[field.key]"
                                        class="form-select"
                                    >
                                        <option v-for="opt in yesNoOptions" :key="String(opt.value)" :value="opt.value">
                                            {{ opt.text }}
                                        </option>
                                    </select>
                                    <input
                                        v-else-if="field.key === 'website_url'"
                                        :value="publicUnitUrl || 'Generated after save when property has a website slug'"
                                        type="text"
                                        class="form-control"
                                        readonly
                                    />
                                    <UnitPhotosEditor
                                        v-else-if="field.key === 'unit_photos'"
                                        ref="unitPhotos"
                                        v-model="unitForm.asset_image_urls"
                                        v-model:cover-image-url="unitForm.cover_image_url"
                                        :project-id="unitForm.project_id"
                                        :unit-id="activeUnit?.id"
                                        label=""
                                    />
                                    <textarea
                                        v-else-if="field.type === 'textarea'"
                                        v-model="unitForm[field.key]"
                                        class="form-control"
                                        :rows="field.rows || 4"
                                        :placeholder="field.placeholder || ''"
                                    ></textarea>
                                    <input
                                        v-else
                                        v-model="unitForm[field.key]"
                                        :type="field.inputType || 'text'"
                                        class="form-control"
                                        :step="field.step"
                                        :min="field.min"
                                        :required="field.required"
                                        :placeholder="field.placeholder || ''"
                                    />
                                </div>
                                <div class="col-12">
                                    <UnitListingFields
                                        v-model:listing-type="unitForm.listing_type"
                                        v-model:unit-price="unitForm.unit_price"
                                        v-model:monthly-rent="unitForm.monthly_rent"
                                        v-model:daily-rent="unitForm.daily_rent"
                                        v-model:hourly-rent="unitForm.hourly_rent"
                                    >
                                        <template #sale-extra>
                                            <div class="payment-terms-field mt-3">
                                                <label class="form-label">Payment Terms</label>
                                                <div class="payment-terms-checklist">
                                                    <label
                                                        v-for="option in paymentTermOptions"
                                                        :key="option"
                                                        class="payment-terms-checklist__item form-check"
                                                    >
                                                        <input
                                                            v-model="selectedPaymentTerms"
                                                            class="form-check-input"
                                                            type="checkbox"
                                                            :value="option"
                                                        />
                                                        <span class="form-check-label">{{ option }}</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="mt-3">
                                                <label class="form-label">Payment Terms Link</label>
                                                <input
                                                    v-model="unitForm.payment_terms_link"
                                                    type="url"
                                                    class="form-control"
                                                    :placeholder="fieldPlaceholder('payment_terms_link')"
                                                />
                                            </div>
                                        </template>
                                    </UnitListingFields>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cancelUnitEdit">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="savingUnit">Save</button>
                        </div>
                    </form>
        </ModalShell>
    </div>
</template>

<script>
import Formatters from '@mixins/formatters';
import { confirmDelete } from '@/utils/confirmDelete';
import PageHeader from '@/components/layout/PageHeader.vue';
import ListTableCard from '@/components/ListTableCard.vue';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableActionsDropdown from '@/components/TableActionsDropdown.vue';
import TablePagination from '@/components/TablePagination.vue';
import SortableTh from '@/components/SortableTh.vue';
import ModalShell from '@/components/ModalShell.vue';
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import UnitPhotosEditor from '@/components/UnitPhotosEditor.vue';
import UnitListingFields from '@/components/UnitListingFields.vue';
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';
import {
    formatUnitListingPrice,
    formatUnitListingType,
    UNIT_LISTING_FILTER_OPTIONS,
    emptyUnitListingFields,
} from '@/utils/unitListingDisplay';
import {
    applySortToQuery,
    nextSortState,
    parseSortQuery,
    sortRows,
} from '@/utils/tableSort';
import recordHighlight from '@/mixins/recordHighlight';
import unitTypes from '@/mixins/unitTypes';
import { getPublicUnitUrl } from '@/config/publicSite';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import {
    PAYMENT_TERM_OPTIONS,
    formatPaymentTermsDisplay,
    parsePaymentTerms,
    serializePaymentTerms,
} from '@/constants/paymentTerms';
import { UNIT_FIELD_HELP } from '@/constants/fieldHelp';
import { buildUnitRef, isUnitHashRef, resolveUnitListingRef } from '@/utils/unitSlug';

const PER_PAGE = 25;

const YES_NO_OPTIONS = [
    { value: true, text: 'Yes' },
    { value: false, text: 'No' },
];

const LIST_FIELDS = [
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'unit_size', label: 'Unit Size' },
    { key: 'unit_price', label: 'Price' },
    { key: 'listing_type', label: 'Listing Type' },
    { key: 'project_name', label: 'Property' },
    { key: 'building_name', label: 'Building' },
    { key: 'floor', label: 'Floor' },
    { key: 'bedrooms', label: 'Bedrooms' },
];

const SORTABLE_KEYS = LIST_FIELDS.map((field) => field.key);

const DETAIL_FIELDS = [
    { key: 'project_id', label: 'Property Name', required: true },
    { key: 'building_id', label: 'Building', required: true },
    { key: 'unit_type', label: 'Unit Type', type: 'unit_type', required: true },
    { key: 'unit_size', label: 'Unit Size', placeholder: 'e.g. 45 sqm' },
    { key: 'bedrooms', label: 'Bedrooms', inputType: 'number', step: '1', min: '0', placeholder: 'e.g. 2' },
    { key: 'bathrooms', label: 'Bathrooms', inputType: 'number', step: '1', min: '0', placeholder: 'e.g. 1' },
    { key: 'floor', label: 'Floor', inputType: 'number', required: true, placeholder: 'e.g. 12' },
    { key: 'room_number', label: 'Room Number', required: true, placeholder: 'e.g. 1205' },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'website_url', label: 'Website URL' },
    { key: 'unit_photos', label: 'Unit Photos' },
    {
        key: 'images_videos_link',
        label: 'External video link (optional)',
        type: 'url',
        inputType: 'url',
        placeholder: 'e.g. https://youtube.com/watch?v=...',
    },
    {
        key: 'payment_terms_link',
        label: 'Payment Terms Link',
        type: 'url',
        inputType: 'url',
        placeholder: 'e.g. https://example.com/payment-terms',
    },
    { key: 'reservation_fee', label: 'Reservation Fee', inputType: 'number', step: '0.01', placeholder: 'e.g. 50000' },
    { key: 'is_reservation_deductible', label: 'Reservation Deductible', type: 'boolean' },
    { key: 'monthly_dues_per_sqm', label: 'Monthly Dues/sqm', inputType: 'number', step: '0.01', placeholder: 'e.g. 85.00' },
    { key: 'monthly_dues', label: 'Monthly Dues', inputType: 'number', step: '0.01', placeholder: 'e.g. 3825.00' },
    { key: 'is_pet_allowed', label: 'Is Allowed Pet', type: 'boolean' },
    { key: 'allowed_pet_size', label: 'Allowed Pet', placeholder: 'e.g. Small dogs only' },
    { key: 'is_allowed_smoking', label: 'Allowed Smoking', type: 'boolean' },
    {
        key: 'ai_notes',
        label: 'Notes (AI)',
        type: 'textarea',
        rows: 4,
        help: UNIT_FIELD_HELP.ai_notes,
        placeholder: 'e.g. Includes parking slot, ready for occupancy by Q3...',
    },
];

function emptyUnitForm() {
    return {
        project_id: null,
        building_id: null,
        floor: '',
        room_number: '',
        unit_type: '',
        unit_size: '',
        bedrooms: '',
        bathrooms: '',
        unit_price: '',
        ...emptyUnitListingFields(),
        payment_terms: '',
        asset_image_urls: [],
        cover_image_url: '',
        images_videos_link: '',
        payment_terms_link: '',
        reservation_fee: '',
        is_reservation_deductible: false,
        monthly_dues_per_sqm: '',
        monthly_dues: '',
        is_pet_allowed: false,
        allowed_pet_size: '',
        is_allowed_smoking: false,
        ai_notes: '',
    };
}

export default {
    name: 'UnitsPage',
    components: {
        PageHeader,
        ListTableCard,
        TableFiltersBar,
        TableActionsDropdown,
        TablePagination,
        SortableTh,
        ModalShell,
        LabelWithInfo,
        UnitPhotosEditor,
        UnitListingFields,
    },
    mixins: [Formatters, recordHighlight, unitTypes],
    data() {
        return {
            unitsList: [],
            filteredUnits: [],
            currentPage: 1,
            perPage: PER_PAGE,
            sortBy: null,
            sortDir: 'asc',
            searchQuery: '',
            projects: [],
            projectOptions: [],
            projectFilterOptions: [],
            buildingOptions: [],
            selectedProjectId: null,
            selectedUnitType: null,
            selectedListingType: null,
            listFields: LIST_FIELDS,
            detailFields: DETAIL_FIELDS,
            yesNoOptions: YES_NO_OPTIONS,
            showUnitModal: false,
            isViewMode: true,
            isNewUnit: false,
            savingUnit: false,
            activeUnit: null,
            activeModalRecordId: null,
            unitForm: emptyUnitForm(),
            selectedPaymentTerms: [],
            paymentTermOptions: PAYMENT_TERM_OPTIONS,
        };
    },
    computed: {
        sortedUnits() {
            if (!this.sortBy) {
                return this.filteredUnits
                    .slice()
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            return sortRows(this.filteredUnits, {
                sortBy: this.sortBy,
                sortDir: this.sortDir,
                getSortValue: (unit, key) => this.getUnitSortValue(unit, key),
                getTieBreaker: (unit) => unit.created_at || unit.id,
            });
        },
        paginationMeta() {
            const total = this.sortedUnits.length;
            const last_page = total ? Math.ceil(total / this.perPage) : 1;
            const current_page = Math.min(this.currentPage, last_page);

            return {
                current_page,
                last_page,
                total,
                per_page: this.perPage,
            };
        },
        paginatedUnits() {
            if (!this.sortedUnits.length) return [];

            const start = (this.paginationMeta.current_page - 1) * this.perPage;
            return this.sortedUnits.slice(start, start + this.perPage);
        },
        unitModalTitle() {
            if (this.isNewUnit) return 'Add New Unit';

            const unitType = String(this.unitForm.unit_type || this.activeUnit?.unit_type || '').trim();
            const propertyName = String(
                this.activeUnit?.projects?.project_name
                || this.projectOptions.find((option) => option.value === this.unitForm.project_id)?.text
                || '',
            ).trim();
            const detailTitle = unitType && propertyName
                ? `${unitType} - ${propertyName}`
                : (unitType || propertyName || 'Unit Details');

            if (this.isViewMode) return detailTitle;
            return `Edit ${detailTitle}`;
        },
        unitListingPriceDisplay() {
            return formatUnitListingPrice(this.unitForm, (value) => this.formatPrice(value));
        },
        unitTypeFilterOptions() {
            return [
                { value: null, text: 'All Unit Types' },
                ...this.unitTypeOptions.map((name) => ({ value: name, text: name })),
            ];
        },
        listingTypeFilterOptions() {
            return UNIT_LISTING_FILTER_OPTIONS;
        },
        publicUnitUrl() {
            const project = this.activeUnit?.projects;
            const unitRef = this.activeUnit?.slug;

            if (!project?.slug || !unitRef) return '';

            return getPublicUnitUrl(project, unitRef);
        },
        unitReferenceId() {
            return resolveUnitListingRef(this.activeUnit || {});
        },
    },
    async created() {
        this.applyRouteQuery();
        await Promise.all([this.loadProjects(), this.loadUnitTypes()]);
        this.normalizeRouteFilters();
        await this.filterUnits();
        this.syncRouteQuery();
    },
    methods: {
        formatPaymentTermsDisplay,
        formatUnitListingType,
        formatUnitListingPrice,
        queryParamValue(value) {
            if (Array.isArray(value)) return value[0];
            return value;
        },
        applyRouteQuery() {
            const query = this.$route.query || {};
            const search = String(this.queryParamValue(query.q) || '').trim();
            const projectRaw = this.queryParamValue(query.project);
            const listingRaw = this.queryParamValue(query.listing);
            const unitTypeRaw = this.queryParamValue(query.unitType);
            const pageRaw = parseInt(String(this.queryParamValue(query.page) || ''), 10);

            this.searchQuery = search;
            this.selectedProjectId = projectRaw != null && String(projectRaw).trim() !== ''
                ? Number(projectRaw) || String(projectRaw)
                : null;
            this.selectedListingType = listingRaw != null && String(listingRaw).trim() !== ''
                ? String(listingRaw)
                : null;
            this.selectedUnitType = unitTypeRaw != null && String(unitTypeRaw).trim() !== ''
                ? String(unitTypeRaw)
                : null;
            this.currentPage = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

            const { sortBy, sortDir } = parseSortQuery(query, SORTABLE_KEYS);
            this.sortBy = sortBy;
            this.sortDir = sortDir;
        },
        normalizeRouteFilters() {
            if (
                this.selectedProjectId != null
                && !this.projects.some((project) => String(project.id) === String(this.selectedProjectId))
            ) {
                this.selectedProjectId = null;
            }

            if (
                this.selectedListingType != null
                && !UNIT_LISTING_FILTER_OPTIONS.some(
                    (opt) => opt.value != null && String(opt.value) === String(this.selectedListingType),
                )
            ) {
                this.selectedListingType = null;
            }

            if (
                this.selectedUnitType != null
                && !this.unitTypeOptions.some((name) => String(name) === String(this.selectedUnitType))
            ) {
                this.selectedUnitType = null;
            }

            if (this.sortBy && !SORTABLE_KEYS.includes(this.sortBy)) {
                this.sortBy = null;
                this.sortDir = 'asc';
            }
        },
        buildRouteQuery() {
            const query = {};
            const search = this.searchQuery.trim();

            if (search) query.q = search;
            if (this.selectedProjectId != null && this.selectedProjectId !== '') {
                query.project = String(this.selectedProjectId);
            }
            if (this.selectedListingType != null && this.selectedListingType !== '') {
                query.listing = String(this.selectedListingType);
            }
            if (this.selectedUnitType != null && this.selectedUnitType !== '') {
                query.unitType = String(this.selectedUnitType);
            }
            if (this.currentPage > 1) {
                query.page = String(this.currentPage);
            }

            return applySortToQuery(query, this.sortBy, this.sortDir);
        },
        syncRouteQuery() {
            const nextQuery = this.buildRouteQuery();
            const currentQuery = this.$route.query || {};
            const keys = new Set([...Object.keys(nextQuery), ...Object.keys(currentQuery)]);
            const unchanged = [...keys].every(
                (key) => String(this.queryParamValue(currentQuery[key]) || '') === String(nextQuery[key] || ''),
            );

            if (unchanged) return;

            this.$router.replace({ query: nextQuery }).catch(() => {});
        },
        displayValue(item, key) {
            if (key === 'project_name') return item.projects?.project_name || '—';
            if (key === 'building_name') return item.buildings?.building_name || '—';
            if (key === 'listing_type') return formatUnitListingType(item.listing_type);
            if (key === 'unit_price') return formatUnitListingPrice(item, this.formatPrice.bind(this));
            const value = item[key];
            return value === '' || value == null ? '—' : value;
        },
        getUnitSortValue(unit, key) {
            if (key === 'project_name') return unit.projects?.project_name || '';
            if (key === 'building_name') return unit.buildings?.building_name || '';
            if (key === 'listing_type') return formatUnitListingType(unit.listing_type);
            if (key === 'unit_type' || key === 'unit_size') return unit[key] || '';
            if (key === 'bedrooms' || key === 'bathrooms' || key === 'floor') {
                const value = Number(unit[key]);
                return Number.isFinite(value) ? value : null;
            }
            if (key === 'unit_price') {
                if ((unit.listing_type || 'sale') === 'rent') {
                    const monthly = Number(unit.monthly_rent);
                    if (Number.isFinite(monthly) && monthly > 0) return monthly;
                    const daily = Number(unit.daily_rent);
                    if (Number.isFinite(daily) && daily > 0) return daily;
                    const hourly = Number(unit.hourly_rent);
                    if (Number.isFinite(hourly) && hourly > 0) return hourly;
                    return null;
                }
                const price = Number(unit.unit_price);
                return Number.isFinite(price) ? price : null;
            }
            return unit[key] ?? '';
        },
        onSort(columnKey) {
            const next = nextSortState(this.sortBy, this.sortDir, columnKey);
            this.sortBy = next.sortBy;
            this.sortDir = next.sortDir;
            this.currentPage = 1;
            this.syncRouteQuery();
        },
        displayDetailValue(field, value) {
            if (field.key === 'project_id') {
                return this.projectOptions.find((o) => o.value === value)?.text || '—';
            }
            if (field.key === 'building_id') {
                return this.buildingOptions.find((o) => o.value === value)?.text
                    || this.activeUnit?.buildings?.building_name
                    || '—';
            }
            if (field.type === 'boolean') {
                return value ? 'Yes' : 'No';
            }
            if (field.key === 'payment_terms') {
                return formatPaymentTermsDisplay(value);
            }
            if (['unit_price', 'reservation_fee', 'monthly_dues_per_sqm', 'monthly_dues', 'monthly_rent', 'daily_rent', 'hourly_rent'].includes(field.key)) {
                return value === '' || value == null ? '—' : this.formatPrice(value);
            }
            return value === '' || value == null ? '—' : value;
        },
        unitToForm(unit) {
            const paymentTerms = unit.payment_terms || '';

            return {
                project_id: unit.project_id,
                building_id: unit.building_id,
                floor: unit.floor ?? '',
                room_number: unit.room_number || '',
                unit_type: unit.unit_type || '',
                unit_size: unit.unit_size || '',
                bedrooms: unit.bedrooms ?? '',
                bathrooms: unit.bathrooms ?? '',
                unit_price: unit.unit_price ?? '',
                listing_type: unit.listing_type || 'sale',
                monthly_rent: unit.monthly_rent ?? '',
                daily_rent: unit.daily_rent ?? '',
                hourly_rent: unit.hourly_rent ?? '',
                payment_terms: paymentTerms,
                asset_image_urls: (unit.asset_image_urls || (unit.assets || []).map((asset) => asset.image_link).filter(Boolean))
                    .map((url) => resolveMediaUrl(url))
                    .filter(Boolean),
                cover_image_url: unit.cover_image_url || '',
                images_videos_link: unit.images_videos_link || '',
                payment_terms_link: unit.payment_terms_link || '',
                reservation_fee: unit.reservation_fee ?? '',
                is_reservation_deductible: !!unit.is_reservation_deductible,
                monthly_dues_per_sqm: unit.monthly_dues_per_sqm ?? '',
                monthly_dues: unit.monthly_dues ?? '',
                is_pet_allowed: !!unit.is_pet_allowed,
                allowed_pet_size: unit.allowed_pet_size || '',
                is_allowed_smoking: !!unit.is_allowed_smoking,
                ai_notes: unit.ai_notes || '',
            };
        },
        fieldColClass(field) {
            if (field.key === 'payment_terms' || field.key === 'payment_terms_link') return 'd-none';
            if (
                field.key === 'unit_photos'
                || field.key === 'website_url'
                || field.type === 'textarea'
            ) {
                return 'col-12 mb-3';
            }
            return 'col-sm-6 mb-3';
        },
        fieldPlaceholder(key) {
            return this.detailFields.find((field) => field.key === key)?.placeholder || '';
        },
        syncSelectedPaymentTerms(paymentTerms) {
            this.selectedPaymentTerms = parsePaymentTerms(paymentTerms);
        },
        async loadProjects() {
            const res = await this.$api.get('/projects');
            this.projects = res.data.sort((a, b) => a.project_name.localeCompare(b.project_name));
            this.projectOptions = this.projects.map((p) => ({ value: p.id, text: p.project_name }));
            this.projectFilterOptions = [{ value: null, text: 'All Properties' }, ...this.projectOptions];
        },
        async filterUnits() {
            try {
                let url = '/units/projects/list';
                if (this.selectedProjectId) {
                    url = `/projects/${this.selectedProjectId}/units`;
                }
                const res = await this.$api.get(url);
                this.unitsList = res.data;
                this.applyUnitFilters();
            } catch (err) {
                console.error('Failed to fetch units:', err);
            }
        },
        onSearchChange() {
            this.currentPage = 1;
            this.applyUnitFilters();
            this.syncRouteQuery();
        },
        onUnitTypeFilterChange() {
            this.currentPage = 1;
            this.applyUnitFilters();
            this.syncRouteQuery();
        },
        onListingTypeFilterChange() {
            this.currentPage = 1;
            this.applyUnitFilters();
            this.syncRouteQuery();
        },
        applyUnitFilters() {
            let results = this.unitsList;
            const query = this.searchQuery.trim().toLowerCase();

            if (this.selectedListingType != null) {
                results = results.filter(
                    (unit) => String(unit.listing_type || 'sale') === String(this.selectedListingType),
                );
            }

            if (this.selectedUnitType != null) {
                results = results.filter(
                    (unit) => String(unit.unit_type) === String(this.selectedUnitType),
                );
            }

            if (query) {
                results = results.filter((unit) => this.matchesSearch(unit, query));
            }

            this.filteredUnits = results;
            this.clampCurrentPage();
        },
        matchesSearch(unit, query) {
            const listingRef = resolveUnitListingRef(unit).toLowerCase();
            const hashedId = unit.id != null ? buildUnitRef(unit.id).toLowerCase() : '';
            const storedSlug = String(unit.slug || '').trim().toLowerCase();

            // Exact match for public hashed IDs like "8ccafc6a".
            if (isUnitHashRef(query)) {
                return query === listingRef || query === hashedId || query === storedSlug;
            }

            return this.getUnitSearchValues(unit).some(
                (value) => value.toLowerCase().includes(query),
            );
        },
        getUnitSearchValues(unit) {
            const values = [];

            LIST_FIELDS.forEach((field) => {
                values.push(this.displayValue(unit, field.key));
            });

            DETAIL_FIELDS.forEach((field) => {
                if (field.key === 'project_id') {
                    values.push(unit.projects?.project_name);
                    return;
                }
                if (field.key === 'building_id') {
                    values.push(unit.buildings?.building_name);
                    return;
                }
                values.push(this.displayDetailValue(field, unit[field.key]));
            });

            values.push(
                unit.id,
                unit.slug,
                resolveUnitListingRef(unit),
                unit.id != null ? buildUnitRef(unit.id) : null,
                unit.projects?.developer,
                unit.projects?.city,
                unit.projects?.location,
                unit.buildings?.building_type,
                unit.payment_terms,
                unit.unit_price,
                unit.reservation_fee,
                unit.monthly_dues_per_sqm,
                unit.monthly_dues,
            );

            return values
                .filter((value) => value !== '—' && value !== '' && value != null)
                .map((value) => String(value));
        },
        async onProjectFilterChange() {
            this.currentPage = 1;
            await this.filterUnits();
            this.syncRouteQuery();
        },
        async getBuildings(projectId) {
            if (!projectId) return [];
            const res = await this.$api.get(`/projects/${projectId}/buildings`);
            return res.data.map((b) => ({ value: b.id, text: b.building_name }));
        },
        async openViewUnitModal(unit) {
            this.activeModalRecordId = unit.id;
            this.isNewUnit = false;
            this.isViewMode = true;
            this.showUnitModal = true;

            try {
                const res = await this.$api.get(`/units/${unit.id}`);
                this.activeUnit = res.data;
                this.unitForm = this.unitToForm(res.data);
            } catch (err) {
                console.error('Failed to load unit details:', err.response?.data || err);
                this.activeUnit = unit;
                this.unitForm = this.unitToForm(unit);
            }

            this.syncSelectedPaymentTerms(this.unitForm.payment_terms);
            this.buildingOptions = await this.getBuildings(this.unitForm.project_id);
        },
        enableUnitEdit() {
            this.isViewMode = false;
        },
        cancelUnitEdit() {
            if (this.isNewUnit) {
                this.closeUnitModal();
                return;
            }
            this.isViewMode = true;
            this.unitForm = this.unitToForm(this.activeUnit);
            this.syncSelectedPaymentTerms(this.activeUnit.payment_terms);
        },
        closeUnitModal() {
            const highlightId = this.activeModalRecordId;

            this.showUnitModal = false;
            this.isViewMode = true;
            this.isNewUnit = false;
            this.activeUnit = null;
            this.activeModalRecordId = null;
            this.savingUnit = false;
            this.buildingOptions = [];
            this.unitForm = emptyUnitForm();
            this.selectedPaymentTerms = [];

            if (highlightId) {
                this.$nextTick(() => {
                    this.goToRecordPage(highlightId);
                    this.$nextTick(() => this.highlightRecord(highlightId));
                });
            }
        },
        goToRecordPage(id) {
            const index = this.sortedUnits.findIndex((unit) => String(unit.id) === String(id));
            if (index === -1) return;
            this.currentPage = Math.floor(index / this.perPage) + 1;
            this.syncRouteQuery();
        },
        goToPage(page) {
            this.currentPage = page;
            this.syncRouteQuery();
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
        resolveUnitPhotoUrl(url) {
            return resolveMediaUrl(url);
        },
        async onProjectChange() {
            this.unitForm.building_id = null;
            this.unitForm.asset_image_urls = [];
            this.unitForm.cover_image_url = '';
            this.buildingOptions = await this.getBuildings(this.unitForm.project_id);
        },
        buildUnitPayload() {
            return {
                project_id: this.unitForm.project_id,
                building_id: this.unitForm.building_id,
                floor: parseInt(this.unitForm.floor, 10),
                room_number: this.unitForm.room_number,
                unit_type: this.unitForm.unit_type,
                unit_size: this.unitForm.unit_size,
                bedrooms: this.unitForm.bedrooms,
                bathrooms: this.unitForm.bathrooms,
                unit_price: Number(this.unitForm.unit_price) || 0,
                listing_type: this.unitForm.listing_type || 'sale',
                monthly_rent: Number(this.unitForm.monthly_rent) || 0,
                daily_rent: Number(this.unitForm.daily_rent) || 0,
                hourly_rent: Number(this.unitForm.hourly_rent) || 0,
                payment_terms: serializePaymentTerms(this.selectedPaymentTerms) || null,
                images_videos_link: this.unitForm.images_videos_link,
                asset_image_urls: this.unitForm.asset_image_urls,
                cover_image_url: this.unitForm.cover_image_url || null,
                payment_terms_link: this.unitForm.payment_terms_link,
                reservation_fee: Number(this.unitForm.reservation_fee) || 0,
                is_reservation_deductible: this.unitForm.is_reservation_deductible,
                monthly_dues_per_sqm: Number(this.unitForm.monthly_dues_per_sqm) || 0,
                monthly_dues: Number(this.unitForm.monthly_dues) || 0,
                is_pet_allowed: this.unitForm.is_pet_allowed,
                allowed_pet_size: this.unitForm.allowed_pet_size,
                is_allowed_smoking: this.unitForm.is_allowed_smoking,
                ai_notes: this.unitForm.ai_notes,
            };
        },
        async syncUnitPhotosAfterSave(unitId, payload) {
            const hadPending = this.$refs.unitPhotos?.hasPendingUploads?.();
            if (hadPending) {
                await this.$refs.unitPhotos.flushPendingUploads(unitId);
                await this.$api.put(`/units/${unitId}`, {
                    ...payload,
                    asset_image_urls: this.unitForm.asset_image_urls,
                    cover_image_url: this.unitForm.cover_image_url || null,
                });
            }
        },
        async saveUnit() {
            this.savingUnit = true;
            try {
                const payload = this.buildUnitPayload();
                let highlightId = this.activeUnit?.id;

                if (this.isNewUnit) {
                    const res = await this.$api.post('/units', payload);
                    highlightId = res.data.id;
                    await this.syncUnitPhotosAfterSave(highlightId, payload);
                } else {
                    await this.$api.put(`/units/${this.activeUnit.id}`, payload);
                    await this.syncUnitPhotosAfterSave(this.activeUnit.id, payload);
                }

                await this.filterUnits();
                this.activeModalRecordId = highlightId;
                this.closeUnitModal();
            } catch (err) {
                console.error('Error saving unit:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to save unit.'));
            } finally {
                this.savingUnit = false;
            }
        },
        async deleteUnit(unit) {
            if (!(await confirmDelete(`unit ${unit.unit_type} – Room ${unit.room_number}`))) return;
            try {
                await this.$api.delete(`/units/${unit.id}`);
                await this.filterUnits();
            } catch (err) {
                console.error('Failed to delete unit:', err.response?.data || err);
                alert('Failed to delete unit. Please try again.');
            }
        },
    },
};
</script>
