const WHOLE_PROPERTY_BUILDING_TYPES = new Set([
    'Bungalow',
    'Cabin',
    'Cottage',
    'Detached House',
    'Duplex',
    'Farmhouse',
    'Fourplex',
    'Mansion',
    'Row House',
    'Semi-Detached House',
    'Shophouse',
    'Single-Family House',
    'Split-Level House',
    'Three-Storey House',
    'Townhouse',
    'Triplex',
    'Two-Storey House',
    'Villa',
    'Warehouse',
]);

const MULTI_ROOM_WHOLE_BUILDING_TYPES = new Set([
    'Apartelle',
    'Boarding House',
    'Dormitory',
    'Hotel',
    'Motel',
    'Resort',
]);

export const BUILDING_LISTING_MODES = [
    {
        value: 'whole',
        title: 'Entire building',
        description: 'One listing and one price for the whole property.',
        examples: 'House, villa, whole building for sale or rent',
    },
    {
        value: 'units',
        title: 'Units or rooms separately',
        description: 'Each unit or room is listed with its own details and price.',
        examples: 'Condo units, apartelle rooms, office units',
    },
];

export function suggestListingModeForBuildingType(buildingType) {
    if (!buildingType) return null;

    if (WHOLE_PROPERTY_BUILDING_TYPES.has(buildingType)) {
        return 'whole';
    }

    if (MULTI_ROOM_WHOLE_BUILDING_TYPES.has(buildingType)) {
        return 'units';
    }

    return 'units';
}

export function isMultiRoomWholeBuildingType(buildingType) {
    return MULTI_ROOM_WHOLE_BUILDING_TYPES.has(buildingType);
}

export function isHouseWholeBuildingType(buildingType) {
    return WHOLE_PROPERTY_BUILDING_TYPES.has(buildingType);
}

export function isCommercialWholeBuildingType(buildingType) {
    if (!buildingType) return false;
    return !WHOLE_PROPERTY_BUILDING_TYPES.has(buildingType)
        && !MULTI_ROOM_WHOLE_BUILDING_TYPES.has(buildingType);
}
