import BUILDING_TYPE_NAMES from '@/constants/buildingTypes';

export default {
    data() {
        return {
            buildingTypeOptions: [...BUILDING_TYPE_NAMES].sort((a, b) => a.localeCompare(b)),
        };
    },
    methods: {
        async loadBuildingTypes() {
            try {
                const res = await this.$api.get('/building-types');
                if (Array.isArray(res.data) && res.data.length) {
                    this.buildingTypeOptions = res.data
                        .map((item) => item.name)
                        .sort((a, b) => a.localeCompare(b));
                }
            } catch (err) {
                console.error('Failed to load building types:', err.response?.data || err);
                this.buildingTypeOptions = [...BUILDING_TYPE_NAMES].sort((a, b) => a.localeCompare(b));
            }
        },
        isKnownBuildingType(value) {
            return this.buildingTypeOptions.includes(value);
        },
    },
};
