<template>
    <div>
        <PageHeader title="Buildings" />

        <ListTableCard>
            <table class="table table-vcenter table-hover card-table mb-0">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Property Name</th>
                            <th>Building</th>
                            <th>Floor</th>
                            <th>Room Number</th>
                            <th>Unit Type</th>
                            <th>Unit Size</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in units" :key="item.id">
                            <td>{{ item.id }}</td>
                            <td>
                                <div v-if="!item._editMode">{{ item.projects?.project_name || 'No Property' }}</div>
                                <select v-else v-model="item.project_id" class="form-select">
                                    <option v-for="opt in projects" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                                </select>
                            </td>
                            <td>
                                <div v-if="!item._editMode">{{ item.buildings?.building_name || 'No Building' }}</div>
                                <select v-else v-model="item.building_id" class="form-select">
                                    <option v-for="opt in buildings" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
                                </select>
                            </td>
                            <td>{{ item.floor }}</td>
                            <td>{{ item.room_number }}</td>
                            <td>{{ item.unit_type }}</td>
                            <td>{{ item.unit_size }}</td>
                            <td>{{ item.price }}</td>
                            <td>
                                <div v-if="!item._editMode">
                                    <button class="btn btn-sm btn-outline-primary" @click="enableEdit(item)">Edit</button>
                                </div>
                                <div v-else class="d-flex gap-2">
                                    <button class="btn btn-sm btn-success" @click="saveEdit(item)">Save</button>
                                    <button class="btn btn-sm btn-outline-danger" @click="cancelEdit(item)">Cancel</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
            </table>
        </ListTableCard>
    </div>
</template>

<script>
import PageHeader from '@/components/layout/PageHeader.vue';
import ListTableCard from '@/components/ListTableCard.vue';

export default {
    components: { PageHeader, ListTableCard },
    data() {
        return {
            units: [],
            projects: [],
            buildings: [],
        };
    },
    async created() {
        await this.getBuildings();
        await this.getProjects();
        await this.getUnits();
    },
    methods: {
        async getUnits() {
            try {
                const res = await this.$api.get('/units/projects/list');
                this.units = res.data.map((unit) => ({
                    ...unit,
                    _editMode: false,
                    _backup: null,
                    project_id: unit.project_id,
                }));
            } catch (err) {
                console.error('Error fetching units:', err);
            }
        },
        async getProjects() {
            try {
                const res = await this.$api.get('/projects');
                this.projects = res.data.map((item) => ({ value: item.id, text: item.project_name }));
            } catch (err) {
                console.error('Error fetching projects:', err);
            }
        },
        async getBuildings() {
            try {
                const res = await this.$api.get('/buildings');
                this.buildings = res.data.map((item) => ({ value: item.id, text: item.building_name }));
            } catch (err) {
                console.error('Error fetching buildings:', err);
            }
        },
        enableEdit(unit) {
            unit._editMode = true;
            unit._backup = { ...unit };
        },
        cancelEdit(unit) {
            Object.assign(unit, unit._backup);
            unit._editMode = false;
        },
        async saveEdit(unit) {
            try {
                await this.$api.put(`/units/${unit.id}`, {
                    project_id: unit.project_id,
                });
                unit._editMode = false;
                await this.getUnits();
            } catch (err) {
                console.error('Error saving unit:', err);
            }
        },
    },
};
</script>
