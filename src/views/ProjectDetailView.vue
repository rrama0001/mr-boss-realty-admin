<template>
    <div v-if="project">
        <PageHeader
            :title="project.project_name"
            :subtitle="projectSubtitle"
            back-to="/properties"
            back-label="Properties"
            icon="ti ti-building-estate"
            icon-tone="orange"
        />

        <div class="row g-3 g-lg-4">
            <div class="col-12 col-lg-8">
                <div class="card mb-4">
                    <div class="card-header d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
                        <strong>Buildings</strong>
                        <button class="btn btn-sm btn-primary" @click="openBuildingModal()">
                            Add Building
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div v-if="loadingBuildings" class="p-4 text-center">
                            <div class="spinner-border spinner-border-sm"></div>
                        </div>
                        <ul v-else class="list-group list-group-flush">
                            <li
                                v-for="building in buildings"
                                :key="building.id"
                                class="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <strong>{{ building.building_name }}</strong>
                                    <span v-if="building.building_type" class="text-muted ms-2">({{ building.building_type }})</span>
                                    <span v-if="building.status" class="badge bg-azure-lt ms-2">{{ statusLabel(building.status) }}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <span v-if="building.is_whole_property_listing" class="badge bg-green-lt">Whole property</span>
                                    <span v-else class="text-muted small">{{ buildingUnitCount(building) }} unit{{ buildingUnitCount(building) === 1 ? '' : 's' }}</span>
                                    <TableActionsDropdown>
                                        <a
                                            v-if="building.is_whole_property_listing && project.slug && buildingPublicUrl(building)"
                                            :href="buildingPublicUrl(building)"
                                            class="dropdown-item"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            View on website
                                        </a>
                                        <router-link
                                            v-if="!building.is_whole_property_listing"
                                            :to="`/properties/${projectId}/buildings/${building.id}`"
                                            class="dropdown-item"
                                        >
                                            Units
                                        </router-link>
                                        <button type="button" class="dropdown-item" @click="openViewBuildingModal(building)">
                                            View Info
                                        </button>
                                        <button type="button" class="dropdown-item text-danger" @click="removeBuilding(building)">
                                            Delete
                                        </button>
                                    </TableActionsDropdown>
                                </div>
                            </li>
                            <li v-if="!buildings.length" class="list-group-item text-muted">No buildings yet.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h2 class="h6 text-muted">Details</h2>
                        <dl class="mb-0">
                            <dt>Developer</dt>
                            <dd>{{ project.developer || '—' }}</dd>
                            <dt>City</dt>
                            <dd>{{ project.city || '—' }}</dd>
                            <dt>Address</dt>
                            <dd>{{ project.location || '—' }}</dd>
                            <dt>Overall Status</dt>
                            <dd>{{ statusLabel(projectDisplayStatus) }}</dd>
                            <dt>Contact Person</dt>
                            <dd>{{ project.contact_person || '—' }}</dd>
                            <dt>Contact Position</dt>
                            <dd>{{ project.contact_person_position || '—' }}</dd>
                            <dt>Contact Number</dt>
                            <dd>{{ project.contact_person_number || '—' }}</dd>
                            <dt>Email</dt>
                            <dd>{{ project.contact_person_email || '—' }}</dd>
                            <template v-if="project.slug">
                                <dt class="d-inline-flex align-items-center">
                                    Website URL
                                    <FieldInfoPopover
                                        v-if="project.is_private_on_website"
                                        :text="`Public name on the website: ${websitePrivatePropertyLabel}`"
                                    />
                                </dt>
                                <dd>
                                    <a :href="publicPropertyUrl" target="_blank" rel="noopener">
                                        {{ publicPropertyUrl }}
                                    </a>
                                </dd>
                            </template>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <ModalShell v-if="showBuildingModal">
            <form @submit.prevent="saveBuilding(false)">
                <div class="modal-header">
                    <h5 class="modal-title">{{ buildingModalTitle }}</h5>
                    <button type="button" class="btn-close" @click="closeBuildingModal"></button>
                </div>
                <div class="modal-body building-modal">
                    <fieldset :disabled="isViewMode" class="building-modal__fieldset">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Building Name</label>
                            <input
                                v-model="buildingForm.building_name"
                                type="text"
                                class="form-control"
                                placeholder="e.g. Tower A, Main House"
                                required
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Building Type</label>
                            <select
                                v-model="buildingForm.building_type"
                                class="form-select"
                                required
                                @change="onBuildingTypeChange"
                            >
                                <option disabled value="">Select building type</option>
                                <option v-for="name in buildingTypeOptions" :key="name" :value="name">
                                    {{ name }}
                                </option>
                                <option
                                    v-if="buildingForm.building_type && !isKnownBuildingType(buildingForm.building_type)"
                                    :value="buildingForm.building_type"
                                >
                                    {{ buildingForm.building_type }} (current)
                                </option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status</label>
                            <select v-model="buildingForm.status" class="form-select" required>
                                <option disabled value="">Select status</option>
                                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.text }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="building-modal__section">
                        <LabelWithInfo
                            tag="h6"
                            base-class="building-modal__section-title"
                            label="Website listing"
                            :help="buildingFieldHelp.websiteListing"
                        />

                        <div v-if="wholeListingSwitchDisabled" class="alert alert-warning py-2 px-3 small mb-3">
                            This building still has {{ editingBuildingUnitCount }}
                            unit{{ editingBuildingUnitCount === 1 ? '' : 's' }}/room{{ editingBuildingUnitCount === 1 ? '' : 's' }}.
                            <router-link
                                v-if="editingBuilding?.id"
                                :to="`/properties/${projectId}/buildings/${editingBuilding.id}`"
                                @click="closeBuildingModal"
                            >
                                Open Units
                            </router-link>
                            to delete them before switching to entire-building listing.
                        </div>

                        <div class="row g-3">
                            <div
                                v-for="mode in buildingListingModes"
                                :key="mode.value"
                                class="col-md-6"
                            >
                                <label
                                    class="building-modal__mode-card"
                                    :class="{
                                        'building-modal__mode-card--active': listingMode === mode.value,
                                        'building-modal__mode-card--disabled': mode.value === 'whole' && wholeListingSwitchDisabled,
                                    }"
                                >
                                    <input
                                        v-model="listingMode"
                                        class="building-modal__mode-input"
                                        type="radio"
                                        name="building-listing-mode"
                                        :value="mode.value"
                                        :disabled="mode.value === 'whole' && wholeListingSwitchDisabled"
                                        @change="onListingModeChange"
                                    />
                                    <span class="building-modal__mode-title">{{ mode.title }}</span>
                                    <span class="building-modal__mode-description">{{ mode.description }}</span>
                                    <span class="building-modal__mode-examples">e.g. {{ mode.examples }}</span>
                                </label>
                            </div>
                        </div>

                        <p v-if="listingModeSuggestion" class="building-modal__suggestion text-muted small mt-2 mb-0">
                            Suggested for {{ buildingForm.building_type }}: {{ listingModeSuggestion }}.
                        </p>
                    </div>

                    <template v-if="isWholePropertyListing">
                        <div class="building-modal__section">
                            <h6 class="building-modal__section-title">Listing &amp; price</h6>
                            <div class="mb-3">
                                <label class="form-label">Listing type</label>
                                <div class="d-flex flex-wrap gap-3">
                                    <label
                                        v-for="opt in listingTypeOptions"
                                        :key="opt.value"
                                        class="form-check"
                                    >
                                        <input
                                            v-model="buildingForm.listing_type"
                                            class="form-check-input"
                                            type="radio"
                                            name="building-listing-type"
                                            :value="opt.value"
                                            required
                                        />
                                        <span class="form-check-label">{{ opt.text }}</span>
                                    </label>
                                </div>
                            </div>

                            <div v-if="buildingForm.listing_type === 'sale'" class="mb-3">
                                <label class="form-label">Price</label>
                                <input
                                    v-model="buildingForm.sale_price"
                                    type="number"
                                    class="form-control"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <template v-if="buildingForm.listing_type === 'rent'">
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <LabelWithInfo
                                            label="Monthly rental"
                                            :help="buildingFieldHelp.rentalRates"
                                        />
                                        <input v-model="buildingForm.monthly_rent" type="number" class="form-control" min="0" step="0.01" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Daily rental</label>
                                        <input v-model="buildingForm.daily_rent" type="number" class="form-control" min="0" step="0.01" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Hourly rental</label>
                                        <input v-model="buildingForm.hourly_rent" type="number" class="form-control" min="0" step="0.01" />
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div class="building-modal__section">
                            <h6 class="building-modal__section-title">Property details</h6>
                            <div class="row g-3">
                                <div v-if="isHouseWholeType" class="col-md-3">
                                    <label class="form-label">Bedrooms</label>
                                    <input v-model="buildingForm.bedrooms" type="number" class="form-control" min="0" step="1" />
                                </div>
                                <div v-if="isHouseWholeType" class="col-md-3">
                                    <label class="form-label">Bathrooms</label>
                                    <input v-model="buildingForm.bathrooms" type="number" class="form-control" min="0" step="1" />
                                </div>
                                <div v-if="isHouseWholeType" class="col-md-3">
                                    <label class="form-label">Stories</label>
                                    <input v-model="buildingForm.stories" type="number" class="form-control" min="0" step="1" />
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Total floor area</label>
                                    <input
                                        v-model="buildingForm.total_floor_area"
                                        type="text"
                                        class="form-control"
                                        placeholder="e.g. 180 sqm"
                                    />
                                </div>
                                <div v-if="isHouseWholeType" class="col-md-3">
                                    <label class="form-label">Lot area</label>
                                    <input
                                        v-model="buildingForm.lot_area"
                                        type="text"
                                        class="form-control"
                                        placeholder="e.g. 250 sqm"
                                    />
                                </div>
                                <template v-if="isMultiRoomWholeType">
                                    <div class="col-md-4">
                                        <label class="form-label">Total rooms</label>
                                        <input v-model="buildingForm.number_of_units" type="number" class="form-control" min="0" step="1" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Typical room area</label>
                                        <input
                                            v-model="buildingForm.typical_room_area"
                                            type="text"
                                            class="form-control"
                                            placeholder="e.g. 12 sqm"
                                        />
                                    </div>
                                </template>
                            </div>
                        </div>

                        <div class="building-modal__section">
                            <h6 class="building-modal__section-title">Listing details</h6>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Payment terms</label>
                                    <input v-model="buildingForm.payment_terms" type="text" class="form-control" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Payment terms link</label>
                                    <input v-model="buildingForm.payment_terms_link" type="url" class="form-control" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Reservation fee</label>
                                    <input v-model="buildingForm.reservation_fee" type="number" class="form-control" min="0" step="0.01" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Monthly dues</label>
                                    <input v-model="buildingForm.monthly_dues" type="number" class="form-control" min="0" step="0.01" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Monthly dues / sqm</label>
                                    <input v-model="buildingForm.monthly_dues_per_sqm" type="number" class="form-control" min="0" step="0.01" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label d-block">Reservation deductible</label>
                                    <label class="form-check form-check-inline">
                                        <input v-model="buildingForm.is_reservation_deductible" class="form-check-input" type="radio" :value="true" />
                                        <span class="form-check-label">Yes</span>
                                    </label>
                                    <label class="form-check form-check-inline">
                                        <input v-model="buildingForm.is_reservation_deductible" class="form-check-input" type="radio" :value="false" />
                                        <span class="form-check-label">No</span>
                                    </label>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label d-block">Pets allowed</label>
                                    <label class="form-check form-check-inline">
                                        <input v-model="buildingForm.is_pet_allowed" class="form-check-input" type="radio" :value="true" />
                                        <span class="form-check-label">Yes</span>
                                    </label>
                                    <label class="form-check form-check-inline">
                                        <input v-model="buildingForm.is_pet_allowed" class="form-check-input" type="radio" :value="false" />
                                        <span class="form-check-label">No</span>
                                    </label>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Allowed pet size</label>
                                    <input v-model="buildingForm.allowed_pet_size" type="text" class="form-control" placeholder="e.g. Small dogs only" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label d-block">Smoking allowed</label>
                                    <label class="form-check form-check-inline">
                                        <input v-model="buildingForm.is_allowed_smoking" class="form-check-input" type="radio" :value="true" />
                                        <span class="form-check-label">Yes</span>
                                    </label>
                                    <label class="form-check form-check-inline">
                                        <input v-model="buildingForm.is_allowed_smoking" class="form-check-input" type="radio" :value="false" />
                                        <span class="form-check-label">No</span>
                                    </label>
                                </div>
                                <div class="col-12">
                                    <PropertyImagePicker
                                        v-model="buildingGalleryUrls"
                                        :project-id="projectId"
                                        label="Listing photos from property gallery"
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else>
                        <div class="building-modal__section">
                            <LabelWithInfo
                                tag="h6"
                                base-class="building-modal__section-title"
                                label="Building capacity"
                                :help="buildingFieldHelp.buildingCapacity"
                            />
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Number of units/rooms</label>
                                    <input v-model="buildingForm.number_of_units" type="number" class="form-control" min="1" step="1" required />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Available units/rooms</label>
                                    <input v-model="buildingForm.total_available_units" type="number" class="form-control" min="0" step="1" />
                                </div>
                            </div>
                        </div>
                    </template>

                    <div class="building-modal__section mb-0">
                        <h6 class="building-modal__section-title">Other details</h6>
                        <div class="row g-3">
                            <template v-if="buildingForm.status !== 'rfo'">
                                <div class="col-md-6">
                                    <label class="form-label">LTS completion date</label>
                                    <input v-model="buildingForm.lts_completion_date" type="date" class="form-control" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">CTS completion date</label>
                                    <input v-model="buildingForm.cts_completion_date" type="date" class="form-control" />
                                </div>
                            </template>
                            <div class="col-md-6">
                                <label class="form-label">Total parking</label>
                                <input v-model="buildingForm.total_parking" type="number" class="form-control" min="0" step="1" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Available parking</label>
                                <input v-model="buildingForm.total_available_parking" type="number" class="form-control" min="0" step="1" />
                            </div>
                            <div class="col-12">
                                <label class="form-label">Freebies</label>
                                <input
                                    v-model="buildingForm.freebies"
                                    type="text"
                                    class="form-control"
                                    placeholder="e.g. Free AC, Parking, Appliances"
                                />
                            </div>
                        </div>
                    </div>
                    </fieldset>
                </div>
                <div class="modal-footer">
                    <template v-if="isViewMode">
                        <button type="button" class="btn btn-secondary" @click="closeBuildingModal">Close</button>
                        <button type="button" class="btn btn-primary" @click="enableBuildingEdit">Edit</button>
                    </template>
                    <template v-else>
                    <button type="button" class="btn btn-secondary" @click="closeBuildingModal">Cancel</button>
                    <button type="submit" class="btn btn-primary" :disabled="savingBuilding">
                        {{ savingBuilding ? 'Saving…' : 'Save' }}
                    </button>
                    <button
                        v-if="showSaveAndAddUnits"
                        type="button"
                        class="btn btn-outline-primary"
                        :disabled="savingBuilding"
                        @click="saveBuilding(true)"
                    >
                        Save &amp; add units
                    </button>
                    </template>
                </div>
            </form>
        </ModalShell>
    </div>
</template>

<script>
import PageHeader from '@/components/layout/PageHeader.vue';
import TableActionsDropdown from '@/components/TableActionsDropdown.vue';
import { confirmDelete } from '@/utils/confirmDelete';
import buildingTypes from '@/mixins/buildingTypes';
import {
    BUILDING_STATUS_OPTIONS,
    deriveProjectStatusFromBuildings,
    getBuildingStatusLabel,
} from '@/constants/buildingStatuses';
import { BUILDING_LISTING_TYPE_OPTIONS } from '@/constants/buildingListingTypes';
import {
    BUILDING_LISTING_MODES,
    isCommercialWholeBuildingType,
    isHouseWholeBuildingType,
    isMultiRoomWholeBuildingType,
    suggestListingModeForBuildingType,
} from '@/constants/buildingListingDefaults';
import ModalShell from '@/components/ModalShell.vue';
import PropertyImagePicker from '@/components/PropertyImagePicker.vue';
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import FieldInfoPopover from '@/components/FieldInfoPopover.vue';
import { getPublicBuildingUrl, getPublicPropertyUrl } from '@/config/publicSite';
import { WEBSITE_PRIVATE_PROPERTY_LABEL } from '@/constants/privateProperty';
import { BUILDING_FIELD_HELP } from '@/constants/fieldHelp';

function emptyBuildingForm() {
    return {
        is_whole_property_listing: false,
        listing_type: '',
        sale_price: '',
        monthly_rent: '',
        daily_rent: '',
        hourly_rent: '',
        bedrooms: '',
        bathrooms: '',
        stories: '',
        total_floor_area: '',
        typical_room_area: '',
        lot_area: '',
        payment_terms: '',
        payment_terms_link: '',
        reservation_fee: '',
        is_reservation_deductible: '',
        monthly_dues: '',
        monthly_dues_per_sqm: '',
        is_pet_allowed: '',
        allowed_pet_size: '',
        is_allowed_smoking: '',
        images_videos_link: '',
        building_type: '',
        building_name: '',
        number_of_units: '',
        status: '',
        lts_completion_date: '',
        cts_completion_date: '',
        total_available_units: '',
        total_parking: '',
        total_available_parking: '',
        freebies: '',
    };
}

function formatDateForInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

export default {
    name: 'ProjectDetailView',
    components: { PageHeader, TableActionsDropdown, ModalShell, PropertyImagePicker, LabelWithInfo, FieldInfoPopover },
    mixins: [buildingTypes],
    data() {
        return {
            project: null,
            buildings: [],
            loadingBuildings: false,
            showBuildingModal: false,
            savingBuilding: false,
            editingBuilding: null,
            buildingForm: emptyBuildingForm(),
            statusOptions: BUILDING_STATUS_OPTIONS,
            listingTypeOptions: BUILDING_LISTING_TYPE_OPTIONS,
            buildingListingModes: BUILDING_LISTING_MODES,
            listingModeTouched: false,
            buildingFieldHelp: BUILDING_FIELD_HELP,
            isViewMode: false,
        };
    },
    computed: {
        projectId() {
            return this.$route.params.id;
        },
        buildingModalTitle() {
            if (!this.editingBuilding) return 'New Building';
            if (this.isViewMode) {
                return this.buildingForm.building_name || 'Building Details';
            }
            return 'Edit Building';
        },
        buildingGalleryUrls: {
            get() {
                return String(this.buildingForm.images_videos_link || '')
                    .split(/\r?\n|,/)
                    .map((value) => value.trim())
                    .filter(Boolean);
            },
            set(urls) {
                this.buildingForm.images_videos_link = (urls || []).join('\n') || '';
            },
        },
        listingMode: {
            get() {
                return this.buildingForm.is_whole_property_listing ? 'whole' : 'units';
            },
            set(value) {
                this.buildingForm.is_whole_property_listing = value === 'whole';
            },
        },
        isWholePropertyListing() {
            return this.buildingForm.is_whole_property_listing;
        },
        isMultiRoomWholeType() {
            return isMultiRoomWholeBuildingType(this.buildingForm.building_type);
        },
        isHouseWholeType() {
            const type = this.buildingForm.building_type;
            if (!type) return true;
            return isHouseWholeBuildingType(type) || !isCommercialWholeBuildingType(type);
        },
        listingModeSuggestion() {
            const suggested = suggestListingModeForBuildingType(this.buildingForm.building_type);
            if (!suggested || !this.buildingForm.building_type) return '';

            return suggested === 'whole' ? 'entire building' : 'units or rooms separately';
        },
        showSaveAndAddUnits() {
            return !this.isWholePropertyListing;
        },
        wholeListingSwitchDisabled() {
            return this.editingBuildingUnitCount > 0;
        },
        editingBuildingUnitCount() {
            return this.editingBuilding?._count?.units ?? 0;
        },
        projectSubtitle() {
            const parts = [this.project?.developer, this.project?.city || this.project?.location].filter(Boolean);
            return parts.join(' · ') || '';
        },
        projectDisplayStatus() {
            return deriveProjectStatusFromBuildings(this.buildings, this.project?.status);
        },
        publicPropertyUrl() {
            return getPublicPropertyUrl(this.project);
        },
        websitePrivatePropertyLabel() {
            return WEBSITE_PRIVATE_PROPERTY_LABEL;
        },
    },
    async created() {
        await this.loadBuildingTypes();
        await this.load();
    },
    watch: {
        isWholePropertyListing(enabled) {
            if (enabled && !this.buildingForm.listing_type) {
                this.buildingForm.listing_type = 'sale';
            }
        },
    },
    methods: {
        onListingModeChange() {
            this.listingModeTouched = true;
        },
        onBuildingTypeChange() {
            if (this.listingModeTouched || this.editingBuilding) return;

            const suggested = suggestListingModeForBuildingType(this.buildingForm.building_type);
            if (suggested) {
                this.listingMode = suggested;
            }
        },
        buildingUnitCount(building) {
            return building?._count?.units ?? 0;
        },
        buildingPublicUrl(building) {
            if (!this.project?.slug || !building?.is_whole_property_listing) return '';

            const listingRef = building.slug || building.id;
            return getPublicBuildingUrl(this.project, listingRef);
        },
        statusLabel(value) {
            return getBuildingStatusLabel(value);
        },
        buildingToForm(building) {
            return {
                is_whole_property_listing: !!building.is_whole_property_listing,
                listing_type: building.listing_type || '',
                sale_price: building.sale_price ?? '',
                monthly_rent: building.monthly_rent ?? '',
                daily_rent: building.daily_rent ?? '',
                hourly_rent: building.hourly_rent ?? '',
                bedrooms: building.bedrooms ?? '',
                bathrooms: building.bathrooms ?? '',
                stories: building.stories ?? '',
                total_floor_area: building.total_floor_area || '',
                typical_room_area: building.typical_room_area || '',
                lot_area: building.lot_area || '',
                payment_terms: building.payment_terms || '',
                payment_terms_link: building.payment_terms_link || '',
                reservation_fee: building.reservation_fee ?? '',
                is_reservation_deductible: building.is_reservation_deductible ?? '',
                monthly_dues: building.monthly_dues ?? '',
                monthly_dues_per_sqm: building.monthly_dues_per_sqm ?? '',
                is_pet_allowed: building.is_pet_allowed ?? '',
                allowed_pet_size: building.allowed_pet_size || '',
                is_allowed_smoking: building.is_allowed_smoking ?? '',
                images_videos_link: building.images_videos_link || '',
                building_type: building.building_type || '',
                building_name: building.building_name || '',
                number_of_units: building.number_of_units ?? '',
                status: building.status || '',
                lts_completion_date: formatDateForInput(building.lts_completion_date),
                cts_completion_date: formatDateForInput(building.cts_completion_date),
                total_available_units: building.total_available_units ?? '',
                total_parking: building.total_parking ?? '',
                total_available_parking: building.total_available_parking ?? '',
                freebies: building.freebies || '',
            };
        },
        buildBuildingPayload() {
            const payload = {
                ...this.buildingForm,
                is_whole_property_listing: !!this.buildingForm.is_whole_property_listing,
            };

            if (!payload.is_whole_property_listing) {
                payload.listing_type = '';
                payload.sale_price = '';
                payload.monthly_rent = '';
                payload.daily_rent = '';
                payload.hourly_rent = '';
                payload.bedrooms = '';
                payload.bathrooms = '';
                payload.stories = '';
                payload.total_floor_area = '';
                payload.typical_room_area = '';
                payload.lot_area = '';
                payload.payment_terms = '';
                payload.payment_terms_link = '';
                payload.reservation_fee = '';
                payload.is_reservation_deductible = '';
                payload.monthly_dues = '';
                payload.monthly_dues_per_sqm = '';
                payload.is_pet_allowed = '';
                payload.allowed_pet_size = '';
                payload.is_allowed_smoking = '';
                payload.images_videos_link = '';
            } else {
                payload.total_available_units = '';
            }

            return payload;
        },
        async load() {
            try {
                const res = await this.$api.get(`/projects/${this.projectId}`);
                this.project = res.data;
                await this.loadBuildings();
            } catch (err) {
                console.error('Error loading project:', err.response?.data || err);
                this.$router.replace('/properties');
            }
        },
        async loadBuildings() {
            this.loadingBuildings = true;
            try {
                const res = await this.$api.get(`/projects/${this.projectId}/buildings`);
                this.buildings = res.data;
            } catch (err) {
                console.error('Error loading buildings:', err.response?.data || err);
            } finally {
                this.loadingBuildings = false;
            }
        },
        async openViewBuildingModal(building) {
            this.isViewMode = true;
            await this.openBuildingModal(building);
        },
        enableBuildingEdit() {
            this.isViewMode = false;
        },
        async openBuildingModal(building = null) {
            if (!building?.id) {
                this.isViewMode = false;
            }
            this.editingBuilding = building;
            this.buildingForm = emptyBuildingForm();
            this.listingModeTouched = false;
            this.loadBuildingTypes();

            if (building?.id) {
                try {
                    const res = await this.$api.get(`/buildings/${building.id}`);
                    this.editingBuilding = res.data;
                    this.buildingForm = this.buildingToForm(res.data);

                    const index = this.buildings.findIndex((item) => item.id === res.data.id);
                    if (index >= 0) {
                        this.buildings.splice(index, 1, { ...this.buildings[index], ...res.data });
                    }
                } catch (err) {
                    console.error('Error loading building:', err.response?.data || err);
                    this.buildingForm = this.buildingToForm(building);
                }
            }

            this.showBuildingModal = true;
        },
        closeBuildingModal() {
            this.showBuildingModal = false;
            this.editingBuilding = null;
            this.savingBuilding = false;
            this.listingModeTouched = false;
            this.isViewMode = false;
            this.buildingForm = emptyBuildingForm();
        },
        async saveBuilding(andAddUnits = false) {
            this.savingBuilding = true;
            try {
                const payload = this.buildBuildingPayload();
                let buildingId = this.editingBuilding?.id;

                if (this.editingBuilding) {
                    await this.$api.put(`/buildings/${this.editingBuilding.id}`, payload);
                } else {
                    const res = await this.$api.post(`/projects/${this.projectId}/buildings`, payload);
                    buildingId = res.data.id;
                }

                this.closeBuildingModal();
                await this.load();

                if (andAddUnits && buildingId && !payload.is_whole_property_listing) {
                    this.$router.push(`/properties/${this.projectId}/buildings/${buildingId}`);
                }
            } catch (err) {
                console.error('Error saving building:', err.response?.data || err);
                const message = err.response?.data?.error || 'Failed to save building.';
                alert(message);
            } finally {
                this.savingBuilding = false;
            }
        },
        async removeBuilding(building) {
            if (!(await confirmDelete(`building ${building.building_name}`))) return;
            try {
                await this.$api.delete(`/buildings/${building.id}`);
                await this.load();
            } catch (err) {
                console.error('Error deleting building:', err.response?.data || err);
                alert('Failed to delete building.');
            }
        },
    },
};
</script>

<style scoped>
.building-modal__section {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--tblr-border-color, #e6e7e9);
}

.building-modal__fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
}

.building-modal__section-title {
    margin-bottom: 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--tblr-secondary, #667382);
}

.building-modal__mode-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    height: 100%;
    margin: 0;
    padding: 0.9rem 1rem;
    border: 1px solid var(--tblr-border-color, #e6e7e9);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.building-modal__mode-card:hover {
    border-color: var(--tblr-primary, #206bc4);
}

.building-modal__mode-card--active {
    border-color: var(--tblr-primary, #206bc4);
    box-shadow: 0 0 0 1px var(--tblr-primary, #206bc4);
}

.building-modal__mode-card--disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.building-modal__mode-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.building-modal__mode-title {
    font-weight: 600;
}

.building-modal__mode-description,
.building-modal__mode-examples {
    font-size: 0.85rem;
    color: var(--tblr-secondary, #667382);
}
</style>
