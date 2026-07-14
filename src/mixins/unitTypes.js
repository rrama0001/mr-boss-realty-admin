export default {
    data() {
        return {
            unitTypeOptions: [],
        };
    },
    methods: {
        async loadUnitTypes() {
            try {
                const res = await this.$api.get('/unit-types');
                this.unitTypeOptions = res.data.map((item) => item.name);
            } catch (err) {
                console.error('Failed to load unit types:', err.response?.data || err);
            }
        },
        isKnownUnitType(value) {
            return this.unitTypeOptions.includes(value);
        },
    },
};
