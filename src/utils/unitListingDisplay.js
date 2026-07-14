import { BUILDING_LISTING_TYPE_OPTIONS } from '@/constants/buildingListingTypes';

export function formatUnitListingType(value) {
    const match = BUILDING_LISTING_TYPE_OPTIONS.find((opt) => opt.value === (value || 'sale'));
    return match?.text || 'For Sale';
}

export function formatUnitListingPrice(unit = {}, formatPrice) {
    const listingType = unit.listing_type || 'sale';

    if (listingType === 'rent') {
        const parts = [];
        if (unit.monthly_rent > 0) parts.push(`${formatPrice(unit.monthly_rent)} / mo`);
        if (unit.daily_rent > 0) parts.push(`${formatPrice(unit.daily_rent)} / day`);
        if (unit.hourly_rent > 0) parts.push(`${formatPrice(unit.hourly_rent)} / hr`);
        return parts.length ? parts.join(' · ') : 'Rent on request';
    }

    if (unit.unit_price > 0) {
        return formatPrice(unit.unit_price);
    }

    return '—';
}

export function emptyUnitListingFields() {
    return {
        listing_type: 'sale',
        monthly_rent: '',
        daily_rent: '',
        hourly_rent: '',
    };
}

export const UNIT_LISTING_FILTER_OPTIONS = [
    { value: null, text: 'All Listings' },
    ...BUILDING_LISTING_TYPE_OPTIONS,
];
