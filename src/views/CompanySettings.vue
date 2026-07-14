<template>
    <div class="company-settings-section">
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Company profile</h3>
            </div>
            <div class="card-body">
                <div v-if="loading" class="alert alert-info">Loading company info...</div>

                <form v-else @submit.prevent="saveProfile">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label" for="company-name">Company name</label>
                            <input
                                id="company-name"
                                v-model="form.company_name"
                                type="text"
                                class="form-control"
                                placeholder="Mr. Boss Realty"
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="company-legal-name">Legal name</label>
                            <input
                                id="company-legal-name"
                                v-model="form.legal_name"
                                type="text"
                                class="form-control"
                                placeholder="Optional registered business name"
                            />
                        </div>

                        <div class="col-12">
                            <label class="form-label" for="company-tagline">Tagline</label>
                            <input
                                id="company-tagline"
                                v-model="form.tagline"
                                type="text"
                                class="form-control"
                                placeholder="Short public tagline"
                            />
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="company-email">Public email</label>
                            <input
                                id="company-email"
                                v-model="form.email"
                                type="email"
                                class="form-control"
                                placeholder="hello@mrbossrealty.com"
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="company-privacy-email">Privacy / DPO email</label>
                            <input
                                id="company-privacy-email"
                                v-model="form.privacy_email"
                                type="email"
                                class="form-control"
                                placeholder="privacy@mrbossrealty.com"
                            />
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="company-phone">Phone</label>
                            <input
                                id="company-phone"
                                v-model="form.phone"
                                type="text"
                                class="form-control"
                                placeholder="+63 917 000 0000"
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="company-whatsapp">WhatsApp</label>
                            <input
                                id="company-whatsapp"
                                v-model="form.whatsapp"
                                type="text"
                                class="form-control"
                                placeholder="+63 917 000 0000"
                            />
                        </div>

                        <div class="col-md-8">
                            <label class="form-label" for="company-address">Office address</label>
                            <input
                                id="company-address"
                                v-model="form.address"
                                type="text"
                                class="form-control"
                                placeholder="Street, barangay, city"
                            />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" for="company-city">City</label>
                            <input
                                id="company-city"
                                v-model="form.city"
                                type="text"
                                class="form-control"
                                placeholder="Cebu City"
                            />
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="company-hours">Business hours</label>
                            <input
                                id="company-hours"
                                v-model="form.business_hours"
                                type="text"
                                class="form-control"
                                placeholder="8:00 AM – 6:00 PM, Mon–Sat"
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="company-website">Website URL</label>
                            <input
                                id="company-website"
                                v-model="form.website_url"
                                type="url"
                                class="form-control"
                                placeholder="https://www.mrbossrealty.com"
                            />
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="company-facebook">Facebook URL</label>
                            <input
                                id="company-facebook"
                                v-model="form.facebook_url"
                                type="url"
                                class="form-control"
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="company-messenger">Messenger URL</label>
                            <input
                                id="company-messenger"
                                v-model="form.messenger_url"
                                type="url"
                                class="form-control"
                                placeholder="https://m.me/..."
                            />
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="company-instagram">Instagram URL</label>
                            <input
                                id="company-instagram"
                                v-model="form.instagram_url"
                                type="url"
                                class="form-control"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="company-maps">Google Maps URL</label>
                            <input
                                id="company-maps"
                                v-model="form.maps_url"
                                type="url"
                                class="form-control"
                                placeholder="https://maps.google.com/..."
                            />
                        </div>
                    </div>

                    <div class="mt-4 d-flex align-items-center gap-2">
                        <button type="submit" class="btn btn-primary" :disabled="saving">
                            {{ saving ? 'Saving...' : 'Save company info' }}
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
const EMPTY_FORM = {
    company_name: '',
    tagline: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    business_hours: '',
    facebook_url: '',
    messenger_url: '',
    instagram_url: '',
    website_url: '',
    maps_url: '',
    legal_name: '',
    privacy_email: '',
};

export default {
    name: 'CompanySettings',
    data() {
        return {
            loading: true,
            saving: false,
            saved: false,
            error: '',
            form: { ...EMPTY_FORM },
        };
    },
    async mounted() {
        await this.loadProfile();
    },
    methods: {
        applyProfile(data = {}) {
            this.form = {
                ...EMPTY_FORM,
                ...Object.fromEntries(
                    Object.keys(EMPTY_FORM).map((key) => [key, data[key] ?? '']),
                ),
            };
        },
        async loadProfile() {
            try {
                const res = await this.$api.get('/company-profile');
                this.applyProfile(res.data || {});
            } catch (err) {
                console.error('Failed to load company profile:', err);
                this.error = err.response?.data?.error
                    || err.response?.data?.message
                    || 'Failed to load company info.';
            } finally {
                this.loading = false;
            }
        },
        async saveProfile() {
            this.saving = true;
            this.saved = false;
            this.error = '';

            try {
                const res = await this.$api.put('/company-profile', this.form);
                this.applyProfile(res.data || {});
                this.saved = true;
                setTimeout(() => {
                    this.saved = false;
                }, 2000);
            } catch (err) {
                console.error('Failed to save company profile:', err);
                this.error = err.response?.data?.error
                    || err.response?.data?.message
                    || err.response?.data?.details
                    || 'Failed to save company info.';
            } finally {
                this.saving = false;
            }
        },
    },
};
</script>
