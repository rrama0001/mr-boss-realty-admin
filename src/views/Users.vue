<template>
    <div class="users-page">
        <ListTableCard>
            <template #filters>
                <TableFiltersBar>
                    <input
                        v-model="searchQuery"
                        type="search"
                        class="form-control table-filters-bar__search"
                        placeholder="Search users..."
                        @input="onFiltersChange"
                    />
                    <select v-model="selectedRole" class="form-select" @change="onFiltersChange">
                        <option v-for="opt in roleOptions" :key="String(opt.value)" :value="opt.value">
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
                        v-for="item in paginatedUsers"
                        :key="item.id"
                        :class="{ 'table-row--highlighted': isRecordHighlighted(item.id) }"
                        :data-record-id="item.id"
                    >
                        <td v-for="field in listFields" :key="field.key">{{ displayValue(item, field.key) }}</td>
                        <td class="text-end">
                            <TableActionsDropdown>
                                <button type="button" class="dropdown-item" @click="openViewUserModal(item)">
                                    View Info
                                </button>
                                <button type="button" class="dropdown-item text-danger" @click="deleteUser(item)">
                                    Delete
                                </button>
                            </TableActionsDropdown>
                        </td>
                    </tr>
                    <tr v-if="!filteredUsers.length">
                        <td :colspan="listFields.length + 1" class="text-center text-secondary py-4">
                            No users found.
                        </td>
                    </tr>
                </tbody>
            </table>

            <template #footer>
                <TablePagination embedded :meta="paginationMeta" @page-change="goToPage" />
            </template>
        </ListTableCard>

        <ModalShell v-if="showUserModal">
            <template v-if="isViewMode">
                <div class="modal-header">
                    <h5 class="modal-title">{{ userModalTitle }}</h5>
                    <button type="button" class="btn-close" aria-label="Close" @click="closeUserModal"></button>
                </div>
                <div class="modal-body">
                    <dl class="row mb-0 record-detail-list">
                        <template v-for="field in detailFields" :key="field.key">
                            <dt class="col-sm-4">{{ field.label }}</dt>
                            <dd class="col-sm-8">
                                {{ displayDetailValue(field.key, userForm[field.key]) }}
                            </dd>
                        </template>
                    </dl>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeUserModal">Close</button>
                    <button type="button" class="btn btn-primary" @click="enableUserEdit">Edit</button>
                </div>
            </template>
            <form v-else @submit.prevent="saveUser">
                <div class="modal-header">
                    <h5 class="modal-title">{{ userModalTitle }}</h5>
                    <button type="button" class="btn-close" aria-label="Close" @click="closeUserModal"></button>
                </div>
                <div class="modal-body">
                    <div v-for="field in detailFields" :key="field.key" class="mb-3">
                        <label class="form-label">{{ field.label }}</label>
                        <select
                            v-if="field.key === 'role'"
                            v-model="userForm.role"
                            class="form-select"
                            required
                        >
                            <option v-for="opt in roleSelectOptions" :key="opt.value" :value="opt.value">
                                {{ opt.text }}
                            </option>
                        </select>
                        <select
                            v-else-if="field.key === 'can_login'"
                            v-model="userForm.can_login"
                            class="form-select"
                            required
                        >
                            <option v-for="opt in yesNoOptions" :key="String(opt.value)" :value="opt.value">
                                {{ opt.text }}
                            </option>
                        </select>
                        <input
                            v-else
                            v-model="userForm[field.key]"
                            :type="field.inputType || 'text'"
                            class="form-control"
                            :required="field.required"
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="cancelUserEdit">Cancel</button>
                    <button type="submit" class="btn btn-primary" :disabled="savingUser">Save</button>
                </div>
            </form>
        </ModalShell>
    </div>
</template>

<script>
import ListTableCard from '@/components/ListTableCard.vue';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableActionsDropdown from '@/components/TableActionsDropdown.vue';
import TablePagination from '@/components/TablePagination.vue';
import ModalShell from '@/components/ModalShell.vue';
import recordHighlight from '@/mixins/recordHighlight';
import { confirmDelete } from '@/utils/confirmDelete';

const PER_PAGE = 25;

const LIST_FIELDS = [
    { key: 'username', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'can_login', label: 'Can Login' },
];

const DETAIL_FIELDS = [
    { key: 'username', label: 'Full Name', required: true },
    { key: 'email', label: 'Email', inputType: 'email', required: true },
    { key: 'role', label: 'Role', required: true },
    { key: 'can_login', label: 'Can Login', required: true },
];

const ROLE_SELECT_OPTIONS = [
    { value: 'admin', text: 'Admin' },
    { value: 'user', text: 'User' },
];

const YES_NO_OPTIONS = [
    { value: true, text: 'Yes' },
    { value: false, text: 'No' },
];

function emptyUserForm() {
    return {
        username: '',
        email: '',
        role: 'user',
        can_login: true,
    };
}

export default {
    name: 'UsersPage',
    components: {
        ListTableCard,
        TableFiltersBar,
        TableActionsDropdown,
        TablePagination,
        ModalShell,
    },
    mixins: [recordHighlight],
    data() {
        return {
            usersList: [],
            filteredUsers: [],
            searchQuery: '',
            selectedRole: null,
            roleOptions: [],
            listFields: LIST_FIELDS,
            detailFields: DETAIL_FIELDS,
            roleSelectOptions: ROLE_SELECT_OPTIONS,
            yesNoOptions: YES_NO_OPTIONS,
            currentPage: 1,
            perPage: PER_PAGE,
            showUserModal: false,
            isViewMode: true,
            savingUser: false,
            activeUser: null,
            activeModalRecordId: null,
            userForm: emptyUserForm(),
        };
    },
    computed: {
        paginatedUsers() {
            if (!this.filteredUsers.length) return [];
            const start = (this.paginationMeta.current_page - 1) * this.perPage;
            return this.filteredUsers.slice(start, start + this.perPage);
        },
        paginationMeta() {
            const total = this.filteredUsers.length;
            const last_page = total ? Math.ceil(total / this.perPage) : 1;
            const current_page = Math.min(this.currentPage, last_page);

            return {
                current_page,
                last_page,
                total,
                per_page: this.perPage,
            };
        },
        userModalTitle() {
            if (this.isViewMode) {
                return this.userForm.username || 'User Details';
            }
            return 'Edit User';
        },
    },
    async created() {
        await this.loadUsers();
    },
    methods: {
        displayValue(item, key) {
            if (key === 'can_login') return item.can_login ? 'Yes' : 'No';
            if (key === 'role') return this.formatRole(item.role);
            return item[key] || '—';
        },
        displayDetailValue(key, value) {
            if (key === 'can_login') return value ? 'Yes' : 'No';
            if (key === 'role') return this.formatRole(value);
            return value === '' || value == null ? '—' : value;
        },
        formatRole(value) {
            if (!value) return '—';
            return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        },
        userToForm(user) {
            return {
                username: user.username || '',
                email: user.email || '',
                role: user.role?.toLowerCase() || 'user',
                can_login: !!user.can_login,
            };
        },
        async loadUsers() {
            try {
                const res = await this.$api.get('/users');
                this.usersList = res.data
                    .map((u) => ({
                        ...u,
                        role: u.role?.toLowerCase() || 'user',
                    }))
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

                const roles = [...new Set(this.usersList.map((u) => u.role))].sort();
                this.roleOptions = [
                    { value: null, text: 'All Roles' },
                    ...roles.map((r) => ({
                        value: r,
                        text: this.formatRole(r),
                    })),
                ];

                if (
                    this.selectedRole != null
                    && !this.usersList.some((u) => u.role === this.selectedRole)
                ) {
                    this.selectedRole = null;
                }

                this.applyUserFilters();
            } catch (err) {
                console.error('Error loading users:', err.response?.data || err);
            }
        },
        onFiltersChange() {
            this.currentPage = 1;
            this.applyUserFilters();
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
        applyUserFilters() {
            let results = this.usersList;

            if (this.selectedRole != null) {
                results = results.filter((u) => u.role === this.selectedRole);
            }

            const query = this.searchQuery.trim().toLowerCase();
            if (query) {
                results = results.filter((u) => this.matchesSearch(u, query));
            }

            this.filteredUsers = results;
            this.clampCurrentPage();
        },
        matchesSearch(user, query) {
            return [
                user.username,
                user.email,
                this.formatRole(user.role),
                user.can_login ? 'yes' : 'no',
            ].some((value) => String(value || '').toLowerCase().includes(query));
        },
        openViewUserModal(user) {
            this.activeModalRecordId = user.id;
            this.activeUser = user;
            this.isViewMode = true;
            this.userForm = this.userToForm(user);
            this.showUserModal = true;
        },
        enableUserEdit() {
            this.isViewMode = false;
        },
        cancelUserEdit() {
            this.isViewMode = true;
            this.userForm = this.userToForm(this.activeUser);
        },
        closeUserModal() {
            const highlightId = this.activeModalRecordId;

            this.showUserModal = false;
            this.isViewMode = true;
            this.activeUser = null;
            this.activeModalRecordId = null;
            this.savingUser = false;
            this.userForm = emptyUserForm();

            if (highlightId) {
                this.$nextTick(() => {
                    this.$nextTick(() => this.highlightRecord(highlightId));
                });
            }
        },
        async saveUser() {
            this.savingUser = true;
            try {
                const payload = {
                    username: this.userForm.username,
                    email: this.userForm.email,
                    role: this.userForm.role.toLowerCase(),
                    can_login: !!this.userForm.can_login,
                };

                const res = await this.$api.put(`/users/${this.activeUser.id}`, payload);
                const updated = {
                    ...res.data,
                    role: res.data.role?.toLowerCase() || 'user',
                };

                const idx = this.usersList.findIndex((x) => x.id === this.activeUser.id);
                if (idx !== -1) {
                    this.usersList.splice(idx, 1, updated);
                }

                this.applyUserFilters();
                this.activeModalRecordId = updated.id;
                this.closeUserModal();
            } catch (err) {
                console.error('Error saving user:', err.response?.data || err);
                alert('Failed to save user. Please check console for details.');
            } finally {
                this.savingUser = false;
            }
        },
        async deleteUser(user) {
            if (!(await confirmDelete(`user ${user.username}`))) return;

            try {
                await this.$api.delete(`/users/${user.id}`);
                this.usersList = this.usersList.filter((x) => x.id !== user.id);
                this.applyUserFilters();
            } catch (err) {
                console.error('Error deleting user:', err.response?.data || err);
                alert('Failed to delete user. Please check console for details.');
            }
        },
    },
};
</script>
