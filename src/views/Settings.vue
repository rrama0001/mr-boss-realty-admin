<template>
    <div class="settings-page">
        <PageHeader
            title="Settings"
            subtitle="Manage application configuration."
            icon="ti ti-settings"
            icon-tone="slate"
        />

        <div class="settings-page__accordion accordion" role="presentation">
            <section
                v-for="section in sections"
                :id="section.id"
                :key="section.id"
                class="settings-page__section accordion-item"
            >
                <h2 class="accordion-header settings-page__accordion-header">
                    <button
                        type="button"
                        class="accordion-button settings-page__accordion-button"
                        :class="{ collapsed: openSectionId !== section.id }"
                        :aria-expanded="openSectionId === section.id ? 'true' : 'false'"
                        :aria-controls="`${section.id}-panel`"
                        @click="toggleSection(section.id)"
                    >
                        <span class="settings-page__section-icon" aria-hidden="true">
                            <i :class="section.icon"></i>
                        </span>
                        <span class="settings-page__accordion-copy">
                            <span class="settings-page__section-title">{{ section.label }}</span>
                            <span
                                v-if="section.description"
                                class="settings-page__section-description text-secondary"
                            >
                                {{ section.description }}
                            </span>
                        </span>
                    </button>
                </h2>

                <div
                    :id="`${section.id}-panel`"
                    class="accordion-collapse collapse"
                    :class="{ show: openSectionId === section.id }"
                    role="region"
                    :aria-labelledby="section.id"
                >
                    <div class="accordion-body settings-page__accordion-body">
                        <template v-if="openSectionId === section.id">
                            <CompanySettings v-if="section.id === 'company-info'" />
                            <AiSettings v-else-if="section.id === 'ai-assistant'" />
                            <Users v-else-if="section.id === 'users'" />
                        </template>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import PageHeader from '@/components/layout/PageHeader.vue'
import CompanySettings from '@/views/CompanySettings.vue'
import AiSettings from '@/views/AiSettings.vue'
import Users from '@/views/Users.vue'
import { SETTINGS_SECTIONS } from '@/config/settingsSections'

const DEFAULT_OPEN_SECTION = 'company-info'

export default {
    name: 'SettingsPage',
    components: {
        PageHeader,
        CompanySettings,
        AiSettings,
        Users,
    },
    data() {
        return {
            openSectionId: DEFAULT_OPEN_SECTION,
        }
    },
    computed: {
        isAdmin() {
            return localStorage.getItem('userRole') === 'admin'
        },
        sections() {
            return SETTINGS_SECTIONS.filter((section) => !section.adminOnly || this.isAdmin)
        },
    },
    methods: {
        toggleSection(sectionId) {
            this.openSectionId = this.openSectionId === sectionId ? '' : sectionId
        },
    },
}
</script>
