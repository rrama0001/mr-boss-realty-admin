<template>
    <div class="properties-page">
        <PageHeader title="Properties">
            <template #actions>
                <button class="btn btn-primary" @click="openAddProjectModal">
                    Add New Property
                </button>
            </template>
        </PageHeader>

        <ListTableCard>
            <template #filters>
                <TableFiltersBar>
                    <input
                        v-model="searchQuery"
                        type="search"
                        class="form-control table-filters-bar__search"
                        placeholder="Search properties..."
                        @input="onFiltersChange"
                    />
                    <select v-model="selectedProjectId" class="form-select" @change="onFiltersChange">
                        <option v-for="opt in projectOptions" :key="String(opt.value)" :value="opt.value">
                            {{ opt.text }}
                        </option>
                    </select>
                    <select v-model="selectedDeveloper" class="form-select" @change="onFiltersChange">
                        <option v-for="opt in developerOptions" :key="String(opt.value)" :value="opt.value">
                            {{ opt.text }}
                        </option>
                    </select>
                    <select v-model="selectedFeatured" class="form-select" @change="onFiltersChange">
                        <option v-for="opt in featuredOptions" :key="String(opt.value)" :value="opt.value">
                            {{ opt.text }}
                        </option>
                    </select>
                </TableFiltersBar>
            </template>

            <table class="table table-vcenter table-hover card-table mb-0">
                <thead>
                    <tr>
                        <th v-for="field in listFields" :key="field.key">{{ field.label }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="item in paginatedProjects"
                        :key="item.id"
                        :class="{ 'table-row--highlighted': isRecordHighlighted(item.id) }"
                        :data-record-id="item.id"
                    >
                        <td v-for="field in listFields" :key="field.key">{{ displayValue(item, field.key) }}</td>
                        <td class="text-end">
                            <TableActionsDropdown>
                                <router-link :to="`/properties/${item.id}`" class="dropdown-item">
                                    Buildings
                                </router-link>
                                <button type="button" class="dropdown-item" @click="openViewProjectModal(item)">
                                    View Info
                                </button>
                                <button type="button" class="dropdown-item text-danger" @click="deleteProject(item)">
                                    Delete
                                </button>
                            </TableActionsDropdown>
                        </td>
                    </tr>
                    <tr v-if="!filteredProjects.length">
                        <td :colspan="listFields.length + 1" class="text-center text-secondary py-4">
                            No properties found.
                        </td>
                    </tr>
                </tbody>
            </table>

            <template #footer>
                <TablePagination embedded :meta="paginationMeta" @page-change="goToPage" />
            </template>
        </ListTableCard>

        <ModalShell v-if="showProjectModal">
                    <template v-if="isViewMode">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ projectModalTitle }}</h5>
                            <button type="button" class="btn-close" aria-label="Close" @click="closeProjectModal"></button>
                        </div>
                        <div class="modal-body">
                            <div
                                v-for="section in projectFormSections"
                                :key="section.id"
                                class="project-form-section"
                            >
                                <h6 class="project-form-section__title">{{ section.title }}</h6>

                                <template v-if="section.websiteSettings">
                                    <dl class="row mb-0 record-detail-list">
                                        <dt class="col-sm-4">Website Slug</dt>
                                        <dd class="col-sm-8">
                                            <template v-if="projectForm.slug">
                                                <a
                                                    :href="getPublicPropertyUrl(projectForm)"
                                                    target="_blank"
                                                    rel="noopener"
                                                >{{ getPublicPropertyUrl(projectForm) }}</a>
                                            </template>
                                            <span v-else>—</span>
                                        </dd>
                                        <dt class="col-sm-4">Display as Private Property on the Website</dt>
                                        <dd class="col-sm-8">{{ projectForm.is_private_on_website ? 'Yes' : 'No' }}</dd>
                                        <dt class="col-sm-4">Featured on homepage</dt>
                                        <dd class="col-sm-8">
                                            <span
                                                v-if="projectForm.is_featured"
                                                class="badge bg-orange-lt text-orange"
                                            >
                                                Featured
                                            </span>
                                            <span v-else>No</span>
                                        </dd>
                                        <template v-if="projectForm.is_featured">
                                            <dt class="col-sm-4">Featured display order</dt>
                                            <dd class="col-sm-8">{{ projectForm.featured_sort_order ?? '—' }}</dd>
                                        </template>
                                        <dt class="col-sm-4">Property Logo</dt>
                                        <dd class="col-sm-8">
                                            <div v-if="projectLogoUrl" class="property-logo-upload__preview property-logo-upload__preview--inline">
                                                <img
                                                    :src="resolvedProjectLogoUrl"
                                                    alt="Property logo"
                                                    class="property-logo-upload__image"
                                                />
                                            </div>
                                            <span v-else>—</span>
                                        </dd>
                                        <dt class="col-sm-4">Property Images</dt>
                                        <dd class="col-sm-8">
                                            <div v-if="projectGalleryImages.length" class="property-gallery-upload__grid">
                                                <div
                                                    v-for="image in projectGalleryImages"
                                                    :key="image.id"
                                                    class="property-gallery-upload__card"
                                                >
                                                    <figure class="property-gallery-upload__item">
                                                        <img
                                                            :src="resolveProjectGalleryUrl(image.url)"
                                                            :alt="galleryImageLabel(image)"
                                                            class="property-gallery-upload__image"
                                                        />
                                                        <span
                                                            v-if="isProjectCoverImage(image.url)"
                                                            class="unit-photos-editor__pick-tag"
                                                        >
                                                            Website Default
                                                        </span>
                                                    </figure>
                                                    <span
                                                        class="property-gallery-upload__label-readonly"
                                                        :title="galleryImageLabel(image)"
                                                    >
                                                        {{ galleryImageLabel(image) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <span v-else>—</span>
                                        </dd>
                                        <dt class="col-sm-4">Overall Status</dt>
                                        <dd class="col-sm-8">
                                            {{ getBuildingStatusLabel(activeProject?.status) }}
                                            <span class="d-block text-muted small mt-1">
                                                Derived from building statuses. Edit under Buildings.
                                            </span>
                                        </dd>
                                    </dl>
                                </template>

                                <dl v-else class="row mb-0 record-detail-list">
                                    <template v-for="field in section.fields" :key="`${section.id}-${field.key}`">
                                        <dt class="col-sm-4">{{ field.label }}</dt>
                                        <dd class="col-sm-8">
                                            <a
                                                v-if="(field.key === 'images_videos_link' || field.key === 'developer_website') && projectForm[field.key]"
                                                :href="projectForm[field.key]"
                                                target="_blank"
                                                rel="noopener"
                                            >{{ projectForm[field.key] }}</a>
                                            <span v-else>{{ displayDetailValue(field.key, projectForm[field.key]) }}</span>
                                        </dd>
                                    </template>
                                </dl>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeProjectModal">Close</button>
                            <button type="button" class="btn btn-primary" @click="enableProjectEdit">Edit</button>
                        </div>
                    </template>
                    <form v-else @submit.prevent="saveProject">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ projectModalTitle }}</h5>
                            <button type="button" class="btn-close" aria-label="Close" @click="closeProjectModal"></button>
                        </div>
                        <div class="modal-body">
                            <div
                                v-for="section in projectFormSections"
                                :key="section.id"
                                class="project-form-section"
                            >
                                <h6 class="project-form-section__title">{{ section.title }}</h6>

                                <template v-if="section.websiteSettings">
                                    <div class="mb-3 readonly-generated-field">
                                        <LabelWithInfo
                                            :for-attr="projectSlugInputId"
                                            base-class="form-label readonly-generated-field__label"
                                            label="Website Slug"
                                            :help="projectFieldHelp.slug"
                                        >
                                            <span class="badge bg-secondary-lt text-secondary">Read-only</span>
                                        </LabelWithInfo>
                                        <div class="input-group">
                                            <span class="input-group-text readonly-generated-field__icon" aria-hidden="true">
                                                <i class="ti ti-lock"></i>
                                            </span>
                                            <input
                                                :id="projectSlugInputId"
                                                :value="projectSlugPreview || 'Generated automatically from property name and city'"
                                                type="text"
                                                class="form-control readonly-generated-field__input"
                                                readonly
                                                aria-readonly="true"
                                                tabindex="-1"
                                            />
                                        </div>
                                        <div v-if="previewProjectUrl" class="slug-preview-link mt-1">
                                            <a :href="previewProjectUrl" target="_blank" rel="noopener">{{ previewProjectUrl }}</a>
                                        </div>
                                    </div>
                                    <div class="form-check form-switch mb-3">
                                        <input
                                            id="project-private"
                                            v-model="projectForm.is_private_on_website"
                                            class="form-check-input"
                                            type="checkbox"
                                        />
                                        <LabelWithInfo
                                            for-attr="project-private"
                                            base-class="form-check-label"
                                            label="Display as Private Property on the Website"
                                            :help="websitePrivatePropertyHelp"
                                        />
                                    </div>
                                    <div class="form-check form-switch mb-3">
                                        <input
                                            id="project-featured"
                                            v-model="projectForm.is_featured"
                                            class="form-check-input"
                                            type="checkbox"
                                        />
                                        <LabelWithInfo
                                            for-attr="project-featured"
                                            base-class="form-check-label"
                                            label="Featured on homepage"
                                            :help="projectFieldHelp.featured"
                                        />
                                    </div>
                                    <div v-if="projectForm.is_featured" class="mb-3">
                                        <label class="form-label" for="project-featured-order">Featured display order</label>
                                        <input
                                            id="project-featured-order"
                                            v-model.number="projectForm.featured_sort_order"
                                            type="number"
                                            min="1"
                                            class="form-control"
                                            placeholder="Optional — lower numbers appear first"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <PropertyLogoUpload
                                            ref="propertyLogo"
                                            :project-id="activeProject?.id"
                                            :logo-url="projectLogoUrl"
                                            @update:logo-url="projectLogoUrl = $event"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <PropertyGalleryUpload
                                            ref="propertyGallery"
                                            :project-id="activeProject?.id"
                                            :cover-image-url="projectCoverImageUrl"
                                            @update:images="projectGalleryImages = $event"
                                            @update:cover-image-url="projectCoverImageUrl = $event"
                                        />
                                    </div>
                                </template>

                                <template v-else>
                                    <div
                                        v-for="field in section.fields"
                                        :key="field.key"
                                        class="mb-3"
                                    >
                                        <LabelWithInfo :label="field.label" :help="field.help" />
                                        <textarea
                                            v-if="field.type === 'textarea'"
                                            v-model="projectForm[field.key]"
                                            class="form-control"
                                            :rows="field.rows || 3"
                                        ></textarea>
                                        <input
                                            v-else
                                            v-model="projectForm[field.key]"
                                            :type="field.type || 'text'"
                                            class="form-control"
                                            :required="field.required"
                                        />
                                    </div>
                                </template>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cancelProjectEdit">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="savingProject">Save</button>
                        </div>
                    </form>
        </ModalShell>
    </div>
</template>

<script>
import PageHeader from '@/components/layout/PageHeader.vue';
import ListTableCard from '@/components/ListTableCard.vue';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableActionsDropdown from '@/components/TableActionsDropdown.vue';
import TablePagination from '@/components/TablePagination.vue';
import ModalShell from '@/components/ModalShell.vue';
import LabelWithInfo from '@/components/LabelWithInfo.vue';
import PropertyLogoUpload from '@/components/PropertyLogoUpload.vue';
import PropertyGalleryUpload from '@/components/PropertyGalleryUpload.vue';
import recordHighlight from '@/mixins/recordHighlight';
import { confirmDelete } from '@/utils/confirmDelete';
import { showAppAlert, getApiErrorMessage } from '@/utils/appAlert';
import { getBuildingStatusLabel } from '@/constants/buildingStatuses';
import { getPublicPropertyUrl } from '@/config/publicSite';
import { WEBSITE_PRIVATE_PROPERTY_HELP, WEBSITE_PRIVATE_PROPERTY_LABEL } from '@/constants/privateProperty';
import { PROJECT_FIELD_HELP } from '@/constants/fieldHelp';
import {
    DEPRECATED_PROJECT_FIELD_VALUES,
    PROJECT_FORM_SECTIONS,
    flattenProjectFormFields,
} from '@/constants/projectFormSections';
import { buildProjectSlug } from '@/utils/projectSlug';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { galleryImageDisplayLabel } from '@/utils/galleryLabel';

const PER_PAGE = 25;

function emptyProjectForm() {
    return {
        project_name: '',
        developer: '',
        developer_website: '',
        developer_notes: '',
        city: '',
        slug: '',
        location: '',
        description: '',
        images_videos_link: '',
        amenities: '',
        contact_person: '',
        contact_person_position: '',
        contact_person_number: '',
        contact_person_email: '',
        is_featured: false,
        featured_sort_order: null,
        is_private_on_website: false,
    };
}

export default {
    name: 'ProjectsPage',
    components: { PageHeader, ListTableCard, TableFiltersBar, TableActionsDropdown, TablePagination, ModalShell, LabelWithInfo, PropertyLogoUpload, PropertyGalleryUpload },
    mixins: [recordHighlight],
    data() {
        return {
            selectedProjectId: null,
            selectedDeveloper: null,
            selectedFeatured: null,
            searchQuery: '',
            currentPage: 1,
            perPage: PER_PAGE,
            showProjectModal: false,
            isViewMode: true,
            isNewProject: false,
            savingProject: false,
            activeProject: null,
            activeModalRecordId: null,
            projectForm: emptyProjectForm(),
            projectLogoUrl: '',
            projectCoverImageUrl: '',
            projectGalleryImages: [],
            projectsList: [],
            projectFieldHelp: PROJECT_FIELD_HELP,
            projectFormSections: PROJECT_FORM_SECTIONS,
            projectSearchFields: flattenProjectFormFields(),
            filteredProjects: [],
            projectOptions: [],
            developerOptions: [],
            featuredOptions: [
                { value: null, text: 'Featured: All' },
                { value: 'yes', text: 'Featured only' },
                { value: 'no', text: 'Not featured' },
            ],
            listFields: [
                { key: 'project_name', label: 'Property' },
                { key: 'is_featured', label: 'Featured' },
                { key: 'developer', label: 'Developer' },
                { key: 'city', label: 'City' },
                { key: 'location', label: 'Address' },
                { key: 'status', label: 'Status' },
                { key: 'contact_person_number', label: 'Contact' },
                { key: 'contact_person_email', label: 'Email' },
            ],
        };
    },
    computed: {
        projectModalTitle() {
            if (this.isNewProject) return 'Add New Property';
            if (this.isViewMode) return this.projectForm.project_name || 'Property Details';
            return 'Edit Property';
        },
        websitePrivatePropertyHelp() {
            return WEBSITE_PRIVATE_PROPERTY_HELP;
        },
        websitePrivatePropertyLabel() {
            return WEBSITE_PRIVATE_PROPERTY_LABEL;
        },
        projectSlugPreview() {
            if (this.isViewMode) {
                return this.projectForm.slug || '';
            }

            const { project_name: projectName, city, is_private_on_website: isPrivate } = this.projectForm;
            if (!String(projectName || '').trim() && !String(city || '').trim()) {
                return '';
            }

            return buildProjectSlug(projectName, city, isPrivate);
        },
        previewProjectUrl() {
            if (!this.projectSlugPreview) return '';

            return getPublicPropertyUrl({
                slug: this.projectSlugPreview,
                city: this.projectForm.city,
                is_private_on_website: this.projectForm.is_private_on_website,
            });
        },
        projectSlugInputId() {
            return 'project-website-slug-preview';
        },
        resolvedProjectLogoUrl() {
            return resolveMediaUrl(this.projectLogoUrl);
        },
        paginationMeta() {
            const total = this.filteredProjects.length;
            const last_page = total ? Math.ceil(total / this.perPage) : 1;
            const current_page = Math.min(this.currentPage, last_page);

            return {
                current_page,
                last_page,
                total,
                per_page: this.perPage,
            };
        },
        paginatedProjects() {
            if (!this.filteredProjects.length) return [];

            const start = (this.paginationMeta.current_page - 1) * this.perPage;
            return this.filteredProjects.slice(start, start + this.perPage);
        },
    },
    async created() {
        await this.loadProjects();
    },
    methods: {
        displayValue(item, key) {
            if (key === 'status') return getBuildingStatusLabel(item.status);
            if (key === 'slug') return item.slug || '—';
            if (key === 'is_featured') {
                return item.is_featured
                    ? 'Yes'
                    : '—';
            }
            const value = item[key];
            return value || '—';
        },
        getPublicPropertyUrl,
        displayDetailValue(key, value) {
            return value || '—';
        },
        getBuildingStatusLabel,
        async loadProjectLogo(projectId) {
            if (!projectId) {
                this.projectLogoUrl = '';
                this.projectCoverImageUrl = '';
                this.projectGalleryImages = [];
                return;
            }

            try {
                const res = await this.$api.get(`/projects/${projectId}`);
                this.projectLogoUrl = resolveMediaUrl(res.data.logo_url || '');
                this.projectCoverImageUrl = resolveMediaUrl(res.data.cover_image_url || '');
                this.projectGalleryImages = (res.data.gallery_images || []).map((image) => ({
                    ...image,
                    url: resolveMediaUrl(image.url),
                }));
            } catch (err) {
                console.error('Error loading property media:', err.response?.data || err);
                this.projectLogoUrl = '';
                this.projectCoverImageUrl = '';
                this.projectGalleryImages = [];
            }
        },
        resolveProjectGalleryUrl(url) {
            return resolveMediaUrl(url);
        },
        isProjectCoverImage(url) {
            const cover = resolveMediaUrl(this.projectCoverImageUrl);
            const candidate = resolveMediaUrl(url);
            return Boolean(cover && candidate && cover === candidate);
        },
        galleryImageLabel(image) {
            return galleryImageDisplayLabel(image, image?.id);
        },
        projectToForm(project) {
            return {
                project_name: project.project_name || '',
                developer: project.developer || '',
                developer_website: project.developer_website || '',
                developer_notes: project.developer_notes || '',
                city: project.city || '',
                slug: project.slug || '',
                location: project.location || '',
                description: project.description || '',
                images_videos_link: project.images_videos_link || '',
                amenities: project.amenities || '',
                contact_person: project.contact_person || '',
                contact_person_position: project.contact_person_position || '',
                contact_person_number: project.contact_person_number || '',
                contact_person_email: project.contact_person_email || '',
                is_featured: !!project.is_featured,
                featured_sort_order: project.featured_sort_order ?? null,
                is_private_on_website: !!project.is_private_on_website,
            };
        },
        openViewProjectModal(project) {
            this.activeModalRecordId = project.id;
            this.activeProject = project;
            this.isNewProject = false;
            this.isViewMode = true;
            this.projectForm = this.projectToForm(project);
            this.projectLogoUrl = '';
            this.projectCoverImageUrl = '';
            this.projectGalleryImages = [];
            this.showProjectModal = true;
            this.loadProjectLogo(project.id);
        },
        openAddProjectModal() {
            this.activeModalRecordId = null;
            this.activeProject = null;
            this.isNewProject = true;
            this.isViewMode = false;
            this.projectForm = emptyProjectForm();
            this.projectLogoUrl = '';
            this.projectCoverImageUrl = '';
            this.projectGalleryImages = [];
            this.showProjectModal = true;
        },
        enableProjectEdit() {
            this.isViewMode = false;
        },
        cancelProjectEdit() {
            if (this.isNewProject) {
                this.closeProjectModal();
                return;
            }
            this.isViewMode = true;
            this.projectForm = this.projectToForm(this.activeProject);
        },
        closeProjectModal() {
            const highlightId = this.activeModalRecordId;

            this.showProjectModal = false;
            this.isViewMode = true;
            this.isNewProject = false;
            this.savingProject = false;
            this.activeProject = null;
            this.activeModalRecordId = null;
            this.projectForm = emptyProjectForm();
            this.projectLogoUrl = '';
            this.projectCoverImageUrl = '';
            this.projectGalleryImages = [];

            if (highlightId) {
                this.$nextTick(() => {
                    this.goToRecordPage(highlightId);
                    this.$nextTick(() => this.highlightRecord(highlightId));
                });
            }
        },
        goToRecordPage(id) {
            const index = this.filteredProjects.findIndex((p) => String(p.id) === String(id));
            if (index === -1) return;
            this.currentPage = Math.floor(index / this.perPage) + 1;
        },
        async saveProject() {
            this.savingProject = true;

            try {
                if (!this.isNewProject && this.$refs.propertyGallery?.flushPendingBeforeSave) {
                    try {
                        await this.$refs.propertyGallery.flushPendingBeforeSave();
                    } catch (err) {
                        showAppAlert(getApiErrorMessage(err, 'Failed to save property images.'));
                        return;
                    }
                } else if (!this.isNewProject && this.$refs.propertyGallery?.saveAllPendingLabels) {
                    try {
                        await this.$refs.propertyGallery.saveAllPendingLabels();
                    } catch (err) {
                        showAppAlert(getApiErrorMessage(err, 'Failed to save image label.'));
                        return;
                    }
                }

                const payload = { ...this.projectForm };
                delete payload.slug;
                payload.developer = String(payload.developer || '').trim() || null;
                payload.developer_website = String(payload.developer_website || '').trim() || null;
                payload.developer_notes = String(payload.developer_notes || '').trim() || null;
                payload.contact_person_position = String(payload.contact_person_position || '').trim() || null;
                Object.assign(payload, DEPRECATED_PROJECT_FIELD_VALUES);
                payload.is_featured = !!payload.is_featured;
                payload.is_private_on_website = !!payload.is_private_on_website;
                if (!payload.is_featured) {
                    payload.featured_sort_order = null;
                }
                const editingId = this.isNewProject ? null : this.activeProject?.id;

                let res;
                if (this.isNewProject) {
                    res = await this.$api.post('/projects', payload);
                    const newId = res.data?.id;
                    if (newId) {
                        try {
                            if (this.$refs.propertyLogo?.flushPendingUpload) {
                                await this.$refs.propertyLogo.flushPendingUpload(newId);
                            }
                            if (this.$refs.propertyGallery?.flushPendingUploads) {
                                await this.$refs.propertyGallery.flushPendingUploads(newId);
                            }
                        } catch (err) {
                            showAppAlert(
                                getApiErrorMessage(
                                    err,
                                    'Property was created, but uploading logo or images failed. Open the property to retry.',
                                ),
                            );
                            await this.loadProjects();
                            this.activeModalRecordId = newId;
                            this.closeProjectModal();
                            return;
                        }
                    }
                } else if (editingId != null) {
                    res = await this.$api.put(`/projects/${editingId}`, payload);
                } else {
                    throw new Error('Missing property id for update');
                }

                await this.loadProjects();
                this.activeModalRecordId = res.data.id;
                this.closeProjectModal();
            } catch (err) {
                console.error('Error saving project:', err.response?.data || err);
                showAppAlert(getApiErrorMessage(err, 'Failed to save property.'));
            } finally {
                this.savingProject = false;
            }
        },
        async loadProjects() {
            const res = await this.$api.get('/projects');
            this.projectsList = res.data.map((p) => ({ ...p, isNew: false }));

            const projects = [...this.projectsList]
                .sort((a, b) => a.project_name.localeCompare(b.project_name))
                .map((p) => ({ value: p.id, text: p.project_name }));

            this.projectOptions = [{ value: null, text: 'All Properties' }, ...projects];

            const developers = [...new Set(this.projectsList.map((p) => p.developer).filter(Boolean))].sort();
            this.developerOptions = [{ value: null, text: 'All Developers' }, ...developers.map((d) => ({ value: d, text: d }))];

            if (
                this.selectedProjectId != null
                && !this.projectsList.some((p) => String(p.id) === String(this.selectedProjectId))
            ) {
                this.selectedProjectId = null;
            }

            if (
                this.selectedDeveloper
                && !developers.includes(this.selectedDeveloper)
            ) {
                this.selectedDeveloper = null;
            }

            this.filterProjects();
        },
        onFiltersChange() {
            this.currentPage = 1;
            this.filterProjects();
        },
        goToPage(page) {
            this.currentPage = page;
        },
        clampCurrentPage() {
            const lastPage = this.paginationMeta.last_page;
            if (this.currentPage > lastPage) {
                this.currentPage = lastPage;
            }
            if (this.currentPage < 1) {
                this.currentPage = 1;
            }
        },
        filterProjects() {
            let results = this.projectsList;

            if (this.selectedProjectId != null) {
                results = results.filter((p) => String(p.id) === String(this.selectedProjectId));
            }

            if (this.selectedDeveloper) {
                results = results.filter((p) => p.developer === this.selectedDeveloper);
            }

            if (this.selectedFeatured === 'yes') {
                results = results.filter((p) => p.is_featured);
            } else if (this.selectedFeatured === 'no') {
                results = results.filter((p) => !p.is_featured);
            }

            const query = this.searchQuery.trim().toLowerCase();
            if (query) {
                results = results.filter((p) => this.matchesSearch(p, query));
            }

            this.filteredProjects = results;
            this.clampCurrentPage();
        },
        matchesSearch(project, query) {
            const values = this.projectSearchFields.map((field) => project[field.key]);
            values.push(getBuildingStatusLabel(project.status));
            values.push(project.is_featured ? 'featured' : 'not featured');

            return values.some((value) => String(value || '').toLowerCase().includes(query));
        },
        async deleteProject(p) {
            if (!(await confirmDelete(`property ${p.project_name}`))) return;

            try {
                await this.$api.delete(`/projects/${p.id}`);
                this.projectsList = this.projectsList.filter((x) => x.id !== p.id);
                this.filterProjects();
            } catch (err) {
                console.error('Error deleting project:', err.response?.data || err);
                alert('Failed to delete property. Please check console for details.');
            }
        },
    },
};
</script>
