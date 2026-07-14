export const BUILDING_STATUS_OPTIONS = [
    { value: 'under_construction', text: 'Under Construction' },
    { value: 'pre_selling', text: 'Pre-Selling' },
    { value: 'rfo', text: 'RFO' },
];

const STATUS_LABELS = {
    under_construction: 'Under Construction',
    pre_selling: 'Pre-Selling',
    rfo: 'RFO',
    mixed_phases: 'Multiple Phases',
};

export function getBuildingStatusLabel(value) {
    if (!value) return '—';
    return STATUS_LABELS[value] || value.replace(/_/g, ' ');
}

export function deriveProjectStatusFromBuildings(buildings = [], fallback = null) {
    const statuses = buildings.map((building) => building.status).filter(Boolean);

    if (!statuses.length) {
        return fallback || null;
    }

    const unique = [...new Set(statuses)];
    if (unique.length === 1) {
        return unique[0];
    }

    return 'mixed_phases';
}
