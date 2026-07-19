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
                            <LabelWithInfo
                                for-attr="property-page-records-per-page"
                                label="Pagination records per page"
                                help="Number of listing cards displayed on each page of the public Properties page."
                            />
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
                        </div>
                    </div>

                    <div class="border-top mt-4 pt-4">
                        <h4 class="h5 mb-3">Website chat</h4>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <LabelWithInfo
                                    for-attr="otp-trigger-question-count"
                                    label="Number of questions to trigger OTP"
                                    help="Leave empty for no OTP. Set to 10 to allow 10 free client questions on the website chat, then require mobile/email OTP before continuing. Does not apply to Facebook Messenger."
                                />
                                <input
                                    id="otp-trigger-question-count"
                                    v-model="form.otp_trigger_question_count"
                                    type="number"
                                    class="form-control"
                                    min="1"
                                    max="100"
                                    step="1"
                                    placeholder="Leave empty to disable"
                                />
                            </div>

                            <div class="col-md-6">
                                <LabelWithInfo
                                    for-attr="chat-idle-ttl-hours"
                                    label="Hours to delete idle chats"
                                    help="Leave empty to keep website chat history until the visitor deletes it or closes the browser tab. Set to 24 to clear the chat UI after 24 hours with no new messages, and start a fresh session on the next ask. Website chat only — does not apply to Facebook Messenger."
                                />
                                <input
                                    id="chat-idle-ttl-hours"
                                    v-model="form.chat_idle_ttl_hours"
                                    type="number"
                                    class="form-control"
                                    min="1"
                                    max="720"
                                    step="1"
                                    placeholder="Leave empty to disable"
                                />
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
import LabelWithInfo from '@/components/LabelWithInfo.vue';

const DEFAULT_PAGE_SIZE = 15;

export default {
    name: 'WebsiteSettings',
    components: { LabelWithInfo },
    data() {
        return {
            loading: true,
            saving: false,
            saved: false,
            error: '',
            form: {
                property_page_records_per_page: DEFAULT_PAGE_SIZE,
                otp_trigger_question_count: '',
                chat_idle_ttl_hours: '',
            },
        };
    },
    async mounted() {
        await this.loadSettings();
    },
    methods: {
        normalizeOptionalInt(value) {
            if (value === null || value === undefined || value === '') {
                return '';
            }
            const parsed = Number(value);
            return Number.isInteger(parsed) ? parsed : '';
        },
        async loadSettings() {
            this.error = '';
            try {
                const res = await this.$api.get('/website-settings');
                this.form.property_page_records_per_page =
                    res.data?.property_page_records_per_page || DEFAULT_PAGE_SIZE;
                this.form.otp_trigger_question_count = this.normalizeOptionalInt(
                    res.data?.otp_trigger_question_count,
                );
                this.form.chat_idle_ttl_hours = this.normalizeOptionalInt(
                    res.data?.chat_idle_ttl_hours,
                );
            } catch (err) {
                console.error('Failed to load website settings:', err);
                this.error = err.response?.data?.error
                    || err.response?.data?.message
                    || 'Failed to load website settings.';
            } finally {
                this.loading = false;
            }
        },
        toNullableInt(value) {
            if (value === '' || value === null || value === undefined) {
                return null;
            }
            return Number(value);
        },
        async saveSettings() {
            this.saving = true;
            this.saved = false;
            this.error = '';

            try {
                const payload = {
                    property_page_records_per_page: this.form.property_page_records_per_page,
                    otp_trigger_question_count: this.toNullableInt(this.form.otp_trigger_question_count),
                    chat_idle_ttl_hours: this.toNullableInt(this.form.chat_idle_ttl_hours),
                };
                const res = await this.$api.put('/website-settings', payload);
                this.form.property_page_records_per_page =
                    res.data?.property_page_records_per_page || DEFAULT_PAGE_SIZE;
                this.form.otp_trigger_question_count = this.normalizeOptionalInt(
                    res.data?.otp_trigger_question_count,
                );
                this.form.chat_idle_ttl_hours = this.normalizeOptionalInt(
                    res.data?.chat_idle_ttl_hours,
                );
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
