<template>
    <div v-if="building">
        <PageHeader
            :title="pageTitle"
            :subtitle="buildingSubtitle"
            :back-to="`/properties/${projectId}`"
            back-label="Buildings"
            icon="ti ti-building"
            icon-tone="cyan"
        >
            <template #actions>
                <button
                    v-if="!isWholePropertyListing"
                    class="btn btn-primary"
                    @click="openUnitModal()"
                >
                    <i class="ti ti-plus me-1"></i>
                    Add Unit
                </button>
            </template>
        </PageHeader>

        <div v-if="isWholePropertyListing" class="alert alert-info mb-4">
            This building is listed as a whole property. Edit pricing under
            <router-link :to="`/properties/${projectId}`">Buildings</router-link>.
        </div>

        <div class="row g-3 g-lg-4">
            <div class="col-12 col-lg-8">
                <div v-if="loadingUnits" class="card">
                    <div class="card-body text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary"></div>
                    </div>
                </div>

                <div v-else-if="!floors.length" class="card">
                    <div class="card-body text-center text-muted py-5">
                        <p v-if="isWholePropertyListing" class="mb-0">
                            This building is listed as a whole property and does not use individual units/rooms.
                        </p>
                        <template v-else>
                            <p class="mb-3">No units yet. Add a unit to start organizing by floor.</p>
                            <button class="btn btn-primary" @click="openUnitModal()">
                                <i class="ti ti-plus me-1"></i>
                                Add Unit
                            </button>
                        </template>
                    </div>
                </div>

                <div v-else class="accordion accordion-tabs floors-accordion" id="floors-accordion">
                    <div v-for="floor in floors" :key="floor.floor" class="accordion-item">
                        <h2 class="accordion-header floor-accordion-header">
                            <button
                                class="accordion-button floor-accordion-toggle"
                                :class="{ collapsed: expandedFloor !== floor.floor }"
                                type="button"
                                @click="toggleFloor(floor.floor)"
                            >
                                <span class="floor-accordion-title">Floor {{ floor.floor }}</span>
                                <span class="floor-accordion-meta">
                                    {{ floor.units.length }} {{ floor.units.length === 1 ? 'Unit' : 'Units' }}
                                </span>
                            </button>
                            <div class="floor-accordion-actions action-icons">
                                <a
                                    href="#"
                                    class="text-primary"
                                    title="Edit floor"
                                    @click.prevent.stop="openEditFloorModal(floor)"
                                >
                                    <i class="ti ti-pencil"></i>
                                </a>
                                <a
                                    href="#"
                                    class="text-danger"
                                    title="Delete floor"
                                    @click.prevent.stop="deleteFloor(floor)"
                                >
                                    <i class="ti ti-trash"></i>
                                </a>
                            </div>
                        </h2>
                        <div
                            class="accordion-collapse collapse"
                            :class="{ show: expandedFloor === floor.floor }"
                        >
                            <div class="accordion-body p-0">
                                <div class="d-flex justify-content-end px-3 pt-3 mb-2">
                                    <button class="btn btn-sm btn-outline-primary" @click="openUnitModal(floor.floor)">
                                        <i class="ti ti-plus me-1"></i>
                                        Add Unit
                                    </button>
                                </div>

                                <ResponsiveTable>
                                    <table class="table table-vcenter table-hover card-table mb-0">
                                        <thead>
                                            <tr>
                                                <th>Room No</th>
                                                <th>Type</th>
                                                <th>Size</th>
                                                <th>Bedrooms</th>
                                                <th>Bathrooms</th>
                                                <th>Listing</th>
                                                <th>Price</th>
                                                <th class="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="unit in floor.units"
                                                :key="unit.id"
                                                :class="{ 'table-row--highlighted': isRecordHighlighted(unit.id) }"
                                                :data-record-id="unit.id"
                                            >
                                                <td>{{ unit.room_number }}</td>
                                                <td>{{ unit.unit_type || '—' }}</td>
                                                <td>{{ unit.unit_size || '—' }}</td>
                                                <td>{{ unit.bedrooms ?? '—' }}</td>
                                                <td>{{ unit.bathrooms ?? '—' }}</td>
                                                <td>{{ formatUnitListingType(unit.listing_type) }}</td>
                                                <td>{{ formatUnitListingPrice(unit, formatPrice) }}</td>
                                                <td class="text-end">
                                                    <TableActionsDropdown>
                                                        <button type="button" class="dropdown-item" @click="openViewUnitModal(unit)">
                                                            View Info
                                                        </button>
                                                        <button type="button" class="dropdown-item text-danger" @click="deleteUnit(unit)">
                                                            Delete
                                                        </button>
                                                    </TableActionsDropdown>
                                                </td>
                                            </tr>
                                            <tr v-if="!floor.units.length">
                                                <td colspan="8" class="text-center text-muted py-4">No units on this floor.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </ResponsiveTable>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h2 class="h6 text-muted">Building Details</h2>
                        <dl class="mb-0">
                            <dt>Type</dt>
                            <dd>{{ building.building_type || '—' }}</dd>
                            <dt>Property</dt>
                            <dd>{{ building.projects?.project_name || '—' }}</dd>
                            <dt>Floors</dt>
                            <dd>{{ floors.length }}</dd>
                            <dt>Total Units</dt>
                            <dd>{{ units.length }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <ModalShell v-if="showFloorModal" size="sm">
                    <form @submit.prevent="saveFloorRenumber">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Floor {{ editingFloorNumber }}</h5>
                            <button type="button" class="btn-close" @click="closeFloorModal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Floor Number</label>
                                <input v-model.number="floorForm.floor" type="number" class="form-control" required />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeFloorModal">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="savingFloor">Save</button>
                        </div>
                    </form>
        </ModalShell>

        <ModalShell v-if="showUnitModal">
                    <template v-if="isViewMode">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ unitModalTitle }}</h5>
                            <button type="button" class="btn-close" aria-label="Close" @click="closeUnitModal"></button>
                        </div>
                        <div class="modal-body">
                            <dl class="row mb-0 record-detail-list">
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
                                        <span v-else>{{ displayDetailValue(field.key, unitForm[field.key]) }}</span>
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
                                    :class="field.key === 'unit_photos' ? 'col-12 mb-3' : 'col-sm-6 mb-3'"
                                >
                                    <label v-if="field.key !== 'unit_photos'" class="form-label">{{ field.label }}</label>
                                    <select
                                        v-if="field.key === 'unit_type'"
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
                                    <UnitPhotosEditor
                                        v-else-if="field.key === 'unit_photos'"
                                        ref="unitPhotos"
                                        v-model="unitForm.asset_image_urls"
                                        v-model:cover-image-url="unitForm.cover_image_url"
                                        :project-id="building?.project_id"
                                        :unit-id="activeUnit?.id"
                                        label="Room Photos"
                                    />
                                    <input
                                        v-else
                                        v-model="unitForm[field.key]"
                                        :type="field.inputType || 'text'"
                                        class="form-control"
                                        :step="field.step"
                                        :min="field.min"
                                        :required="field.required"
                                    />
                                </div>
                                <div class="col-12">
                                    <UnitListingFields
                                        v-model:listing-type="unitForm.listing_type"
                                        v-model:unit-price="unitForm.unit_price"
                                        v-model:monthly-rent="unitForm.monthly_rent"
                                        v-model:daily-rent="unitForm.daily_rent"
                                        v-model:hourly-rent="unitForm.hourly_rent"
                                    />
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
import PageHeader from '@/components/layout/PageHeader.vue';
import TableActionsDropdown from '@/components/TableActionsDropdown.vue';
import ResponsiveTable from '@/components/ResponsiveTable.vue';
import ModalShell from '@/components/ModalShell.vue';
import UnitPhotosEditor from '@/components/UnitPhotosEditor.vue';
import UnitListingFields from '@/components/UnitListingFields.vue';
import { confirmDelete } from '@/utils/confirmDelete';
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import {
    formatUnitListingPrice,
    formatUnitListingType,
    emptyUnitListingFields,
} from '@/utils/unitListingDisplay';
import recordHighlight from '@/mixins/recordHighlight';
import unitTypes from '@/mixins/unitTypes';

function emptyUnitForm(floor = '') {
    return {
        floor: floor === '' ? '' : floor,
        room_number: '',
        unit_type: '',
        unit_size: '',
        bedrooms: '',
        bathrooms: '',
        unit_price: '',
        ...emptyUnitListingFields(),
        asset_image_urls: [],
        cover_image_url: '',
        images_videos_link: '',
        payment_terms_link: '',
        reservation_fee: '',
    };
}

const DETAIL_FIELDS = [
    { key: 'floor', label: 'Floor', inputType: 'number', required: true },
    { key: 'room_number', label: 'Room Number', required: true },
    { key: 'unit_type', label: 'Unit Type', type: 'unit_type', required: true },
    { key: 'unit_size', label: 'Unit Size' },
    { key: 'bedrooms', label: 'Bedrooms', inputType: 'number', step: '1', min: '0' },
    { key: 'bathrooms', label: 'Bathrooms', inputType: 'number', step: '1', min: '0' },
    { key: 'reservation_fee', label: 'Reservation Fee', inputType: 'number', step: '0.01' },
    { key: 'unit_photos', label: 'Room Photos' },
    { key: 'images_videos_link', label: 'External video link (optional)', type: 'url', inputType: 'url' },
    { key: 'payment_terms_link', label: 'Payment Terms Link', type: 'url', inputType: 'url' },
];

export default {
    name: 'BuildingUnitsView',
    components: { PageHeader, TableActionsDropdown, ResponsiveTable, ModalShell, UnitPhotosEditor, UnitListingFields },
    mixins: [Formatters, recordHighlight, unitTypes],
    data() {
        return {
            building: null,
            units: [],
            loadingUnits: false,
            expandedFloor: null,
            showFloorModal: false,
            savingFloor: false,
            editingFloorNumber: null,
            activeFloorGroup: null,
            floorForm: { floor: '' },
            showUnitModal: false,
            isViewMode: true,
            isNewUnit: false,
            savingUnit: false,
            activeUnit: null,
            activeModalRecordId: null,
            unitForm: emptyUnitForm(),
            detailFields: DETAIL_FIELDS,
        };
    },
    computed: {
        projectId() {
            return this.$route.params.propertyId || this.$route.params.projectId;
        },
        buildingId() {
            return this.$route.params.buildingId;
        },
        isWholePropertyListing() {
            return !!this.building?.is_whole_property_listing;
        },
        buildingSubtitle() {
            return this.building?.building_type || '';
        },
        pageTitle() {
            const project = this.building?.projects?.project_name;
            const building = this.building?.building_name;
            return [project, building].filter(Boolean).join(' · ') || 'Units';
        },
        unitListingPriceDisplay() {
            return formatUnitListingPrice(this.unitForm, (value) => this.formatPrice(value));
        },
        floors() {
            const grouped = {};

            this.units.forEach((unit) => {
                const floor = unit.floor;
                if (!grouped[floor]) {
                    grouped[floor] = [];
                }
                grouped[floor].push(unit);
            });

            return Object.keys(grouped)
                .map(Number)
                .sort((a, b) => a - b)
                .map((floor) => ({
                    floor,
                    units: grouped[floor],
                }));
        },
        unitModalTitle() {
            if (this.isNewUnit) return 'Add New Unit';
            if (this.isViewMode) {
                const room = this.unitForm.room_number;
                return room ? `Room ${room}` : 'Unit Details';
            }
            return 'Edit Unit';
        },
    },
    created() {
        this.loadUnitTypes();
        this.load();
    },
    methods: {
        formatUnitListingType,
        formatUnitListingPrice,
        async load() {
            try {
                const res = await this.$api.get(`/buildings/${this.buildingId}`);
                this.building = res.data;
                await this.loadUnits();
            } catch (err) {
                console.error('Error loading building:', err.response?.data || err);
                this.$router.replace(`/properties/${this.projectId}`);
            }
        },
        async loadUnits() {
            this.loadingUnits = true;
            try {
                const res = await this.$api.get(`/buildings/${this.buildingId}/units`);
                this.units = res.data;
            } catch (err) {
                if (this.isWholePropertyListing) {
                    this.units = [];
                } else {
                    console.error('Error loading units:', err.response?.data || err);
                }
            } finally {
                this.loadingUnits = false;
            }
        },
        toggleFloor(floor) {
            this.expandedFloor = this.expandedFloor === floor ? null : floor;
        },
        openEditFloorModal(floorGroup) {
            this.activeFloorGroup = floorGroup;
            this.editingFloorNumber = floorGroup.floor;
            this.floorForm.floor = floorGroup.floor;
            this.showFloorModal = true;
        },
        closeFloorModal() {
            this.showFloorModal = false;
            this.savingFloor = false;
            this.editingFloorNumber = null;
            this.activeFloorGroup = null;
            this.floorForm.floor = '';
        },
        async saveFloorRenumber() {
            if (!this.activeFloorGroup) return;

            const newFloor = parseInt(this.floorForm.floor, 10);
            const oldFloor = this.activeFloorGroup.floor;

            if (newFloor === oldFloor) {
                this.closeFloorModal();
                return;
            }

            this.savingFloor = true;
            try {
                await Promise.all(
                    this.activeFloorGroup.units.map((unit) => this.$api.put(`/units/${unit.id}`, {
                        ...this.buildUnitPayloadFromUnit(unit),
                        floor: newFloor,
                    })),
                );
                this.closeFloorModal();
                await this.loadUnits();
                this.expandedFloor = newFloor;
            } catch (err) {
                console.error('Error updating floor:', err.response?.data || err);
                alert('Failed to update floor.');
            } finally {
                this.savingFloor = false;
            }
        },
        async deleteFloor(floorGroup) {
            const count = floorGroup.units.length;
            if (!count) return;

            if (!(await confirmDelete(`all ${count} unit${count === 1 ? '' : 's'} on Floor ${floorGroup.floor}`))) {
                return;
            }

            await this.performDeleteFloor(floorGroup);
        },
        async performDeleteFloor(floorGroup) {
            try {
                await Promise.all(floorGroup.units.map((unit) => this.$api.delete(`/units/${unit.id}`)));
                if (this.expandedFloor === floorGroup.floor) {
                    this.expandedFloor = null;
                }
                await this.loadUnits();
            } catch (err) {
                console.error('Error deleting floor units:', err.response?.data || err);
                alert('Failed to delete floor units.');
            }
        },
        buildUnitPayloadFromUnit(unit) {
            return {
                project_id: this.building.project_id,
                building_id: parseInt(this.buildingId, 10),
                floor: unit.floor,
                room_number: unit.room_number,
                unit_type: unit.unit_type,
                unit_size: unit.unit_size,
                bedrooms: unit.bedrooms,
                bathrooms: unit.bathrooms,
                unit_price: Number(unit.unit_price) || 0,
                images_videos_link: unit.images_videos_link,
                payment_terms_link: unit.payment_terms_link,
                reservation_fee: Number(unit.reservation_fee) || 0,
            };
        },
        unitToForm(unit) {
            return {
                floor: unit.floor,
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
                asset_image_urls: (unit.asset_image_urls || (unit.assets || []).map((asset) => asset.image_link).filter(Boolean))
                    .map((url) => resolveMediaUrl(url))
                    .filter(Boolean),
                cover_image_url: unit.cover_image_url || '',
                images_videos_link: unit.images_videos_link || '',
                payment_terms_link: unit.payment_terms_link || '',
                reservation_fee: unit.reservation_fee ?? '',
            };
        },
        displayDetailValue(key, value) {
            if (key === 'bedrooms' || key === 'bathrooms') {
                return value === '' || value == null ? '—' : value;
            }
            if (['unit_price', 'reservation_fee', 'monthly_rent', 'daily_rent', 'hourly_rent'].includes(key)) {
                return value === '' || value == null ? '—' : this.formatPrice(value);
            }
            return value === '' || value == null ? '—' : value;
        },
        resolveUnitPhotoUrl(url) {
            return resolveMediaUrl(url);
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
        },
        openUnitModal(floor = '') {
            this.activeModalRecordId = null;
            this.activeUnit = null;
            this.isNewUnit = true;
            this.isViewMode = false;
            this.unitForm = emptyUnitForm(floor);
            this.showUnitModal = true;
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
        },
        closeUnitModal() {
            const highlightId = this.activeModalRecordId;

            this.showUnitModal = false;
            this.isViewMode = true;
            this.isNewUnit = false;
            this.activeUnit = null;
            this.activeModalRecordId = null;
            this.savingUnit = false;
            this.unitForm = emptyUnitForm();

            if (highlightId) {
                this.$nextTick(() => {
                    this.$nextTick(() => this.highlightRecord(highlightId));
                });
            }
        },
        buildUnitPayload() {
            const payload = {
                project_id: this.building.project_id,
                building_id: parseInt(this.buildingId, 10),
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
                asset_image_urls: this.unitForm.asset_image_urls,
                cover_image_url: this.unitForm.cover_image_url || null,
                images_videos_link: this.unitForm.images_videos_link || null,
                payment_terms_link: this.unitForm.payment_terms_link || null,
                reservation_fee: Number(this.unitForm.reservation_fee) || 0,
            };

            if (!this.isNewUnit && this.activeUnit) {
                payload.payment_terms = this.activeUnit.payment_terms ?? null;
                payload.is_reservation_deductible = !!this.activeUnit.is_reservation_deductible;
                payload.monthly_dues_per_sqm = Number(this.activeUnit.monthly_dues_per_sqm) || 0;
                payload.monthly_dues = Number(this.activeUnit.monthly_dues) || 0;
                payload.is_pet_allowed = !!this.activeUnit.is_pet_allowed;
                payload.allowed_pet_size = this.activeUnit.allowed_pet_size || null;
                payload.is_allowed_smoking = !!this.activeUnit.is_allowed_smoking;
            }

            return payload;
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

                const savedFloor = payload.floor;
                await this.loadUnits();
                this.expandedFloor = savedFloor;
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
            if (!(await confirmDelete(`unit ${unit.unit_type} – Room ${unit.room_number}`))) {
                return;
            }

            await this.performDeleteUnit(unit);
        },
        async performDeleteUnit(unit) {
            try {
                await this.$api.delete(`/units/${unit.id}`);
                if (this.expandedFloor === unit.floor && !this.units.some((u) => u.id !== unit.id && u.floor === unit.floor)) {
                    this.expandedFloor = null;
                }
                await this.loadUnits();
            } catch (err) {
                console.error('Error deleting unit:', err.response?.data || err);
                alert('Failed to delete unit.');
            }
        },
    },
};
</script>
