<template>
    <div class="website-settings-section">
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Property page</h3>
            </div>
            <div class="card-body">
                <div v-if="loading" class="alert alert-info">Loading website settings...</div>

                <form v-else @submit.prevent="saveSettings">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label" for="property-page-records-per-page">
                                Pagination records per page
                            </label>
                            <input
                                id="property-page-records-per-page"
                                v-model.number="form.property_page_records_per_page"
                                type="number"
                                class="form-control"
                                min="1"
                                max="100"
                                step="1"
                                required
                            />
                            <div class="form-hint">
                                Number of listing cards displayed on each page of the public Properties page.
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 d-flex align-items-center gap-2">
                        <button type="submit" class="btn btn-primary" :disabled="saving">
                            {{ saving ? 'Saving...' : 'Save website settings' }}
                        </button>
                        <span v-if="saved" class="text-success">Saved!</span>
                        <span v-if="error" class="text-danger">{{ error }}</span>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
const DEFAULT_PAGE_SIZE = 15;

export default {
    name: 'WebsiteSettings',
    data() {
        return {
            loading: true,
            saving: false,
            saved: false,
            error: '',
            form: {
                property_page_records_per_page: DEFAULT_PAGE_SIZE,
            },
        };
    },
    async mounted() {
        await this.loadSettings();
    },
    methods: {
        async loadSettings() {
            this.error = '';
            try {
                const res = await this.$api.get('/website-settings');
                this.form.property_page_records_per_page =
                    res.data?.property_page_records_per_page || DEFAULT_PAGE_SIZE;
            } catch (err) {
                console.error('Failed to load website settings:', err);
                this.error = err.response?.data?.error
                    || err.response?.data?.message
                    || 'Failed to load website settings.';
            } finally {
                this.loading = false;
            }
        },
        async saveSettings() {
            this.saving = true;
            this.saved = false;
            this.error = '';

            try {
                const res = await this.$api.put('/website-settings', this.form);
                this.form.property_page_records_per_page =
                    res.data?.property_page_records_per_page || DEFAULT_PAGE_SIZE;
                this.saved = true;
                window.setTimeout(() => {
                    this.saved = false;
                }, 1800);
            } catch (err) {
                console.error('Failed to save website settings:', err);
                this.error = err.response?.data?.error
                    || err.response?.data?.message
                    || 'Failed to save website settings.';
            } finally {
                this.saving = false;
            }
        },
    },
};
</script>
