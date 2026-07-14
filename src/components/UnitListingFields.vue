<template>
    <div class="unit-listing-fields">
        <LabelWithInfo
            tag="h6"
            base-class="unit-listing-fields__title"
            label="Website listing"
            :help="helpText"
        />
        <p class="text-muted small mb-3">Choose how this unit appears on the public website.</p>

        <div class="mb-3">
            <label class="form-label">Listing type</label>
            <div class="d-flex flex-wrap gap-3">
                <label
                    v-for="opt in listingTypeOptions"
                    :key="opt.value"
                    class="form-check"
                >
                    <input
                        :checked="listingType === opt.value"
                        class="form-check-input"
                        type="radio"
                        name="unit-listing-type"
                        :value="opt.value"
                        @change="$emit('update:listingType', opt.value)"
                    />
                    <span class="form-check-label">{{ opt.text }}</span>
                </label>
            </div>
        </div>

        <template v-if="listingType === 'sale'">
            <div class="mb-3">
                <label class="form-label">Sale price</label>
                <input
                    :value="unitPrice"
                    type="number"
                    class="form-control"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2500000"
                    @input="$emit('update:unitPrice', $event.target.value)"
                />
            </div>
            <slot name="sale-extra" />
        </template>

        <template v-else>
            <div class="row g-3">
                <div class="col-md-4">
                    <LabelWithInfo
                        label="Monthly rental"
                        :help="rentalRatesHelp"
                    />
                    <input
                        :value="monthlyRent"
                        type="number"
                        class="form-control"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 25000"
                        @input="$emit('update:monthlyRent', $event.target.value)"
                    />
                </div>
                <div class="col-md-4">
                    <label class="form-label">Daily rental</label>
                    <input
                        :value="dailyRent"
                        type="number"
                        class="form-control"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 1500"
                        @input="$emit('update:dailyRent', $event.target.value)"
                    />
                </div>
                <div class="col-md-4">
                    <label class="form-label">Hourly rental</label>
                    <input
                        :value="hourlyRent"
                        type="number"
                        class="form-control"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 250"
                        @input="$emit('update:hourlyRent', $event.target.value)"
                    />
                </div>
            </div>
            <p class="text-muted small mt-2 mb-0">Enter at least one rental rate.</p>
        </template>
    </div>
</template>

<script>
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import { BUILDING_FIELD_HELP } from '@/constants/fieldHelp';
import { BUILDING_LISTING_TYPE_OPTIONS } from '@/constants/buildingListingTypes';

export default {
    name: 'UnitListingFields',
    components: { LabelWithInfo },
    props: {
        listingType: {
            type: String,
            default: 'sale',
        },
        unitPrice: {
            type: [String, Number],
            default: '',
        },
        monthlyRent: {
            type: [String, Number],
            default: '',
        },
        dailyRent: {
            type: [String, Number],
            default: '',
        },
        hourlyRent: {
            type: [String, Number],
            default: '',
        },
        helpText: {
            type: String,
            default: 'Choose how this unit appears on the public website.',
        },
        rentalRatesHelp: {
            type: String,
            default: BUILDING_FIELD_HELP.rentalRates,
        },
    },
    emits: [
        'update:listingType',
        'update:unitPrice',
        'update:monthlyRent',
        'update:dailyRent',
        'update:hourlyRent',
    ],
    computed: {
        listingTypeOptions() {
            return BUILDING_LISTING_TYPE_OPTIONS;
        },
    },
};
</script>

<style scoped>
.unit-listing-fields {
    margin-bottom: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--tblr-border-color, #e6e7e9);
}

.unit-listing-fields__title {
    margin-bottom: 0.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--tblr-secondary, #667382);
}
</style>
