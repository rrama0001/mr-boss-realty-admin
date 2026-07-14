	<template>
		<div class="container properties">
		<h3 class="mb-4">Add New Property</h3>
	
		<form @submit.prevent="createProject" class="card p-4 shadow-sm">
			<!-- Property Name -->
			<div class="form-group mb-3">
                <label>Property Name</label>
                <input
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    required
                    placeholder="e.g City Clou"
                />
			</div>
	
			<!-- Location -->
			<div class="form-group mb-3">
                <label>Location</label>
                <input
                    v-model="form.location"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Cebu City"
                />
			</div>
	
			<!-- Description -->
			<div class="form-group mb-3">
                <label>Description</label>
                <textarea
                    v-model="form.description"
                    class="form-control"
                    rows="3"
                    placeholder="Brief description about the property..."
                ></textarea>
			</div>
	
			<!-- Property Type -->
			<div class="form-group mb-3">
                <label>Property Type</label>
                <select v-model="form.project_type" class="form-control">
                    <option value="">Select Type</option>
                    <option>Condominium</option>
                    <option>Subdivision</option>
                    <option>Mixed-use</option>
                </select>
			</div>
	
			<!-- Completion Date -->
			<div class="form-group mb-3">
                <label>Completion Date</label>
                <input
                    v-model="form.completion_date"
                    type="date"
                    class="form-control"
                />
			</div>
	
			<!-- Submit -->
			<div>
			<button
				type="submit"
				class="btn btn-primary"
				:disabled="loading"
			>
				{{ loading ? 'Saving...' : 'Add Property' }}
			</button>
			</div>
	
			<div v-if="message" class="alert mt-3"
			:class="{'alert-success': success, 'alert-danger': !success}">
			{{ message }}
			</div>
		</form>
		</div>
	</template>
	
	<script>
	import axios from 'axios'
	
	export default {
		data() {
            return {
                form: {
                    name            : '',
                    location        : '',
                    description     : '',
                    project_type    : '',
                    completion_date : '',
                    total_units     : null,
                },
                loading             : false,
                message             : '',
                success             : false,
            }
		},
		methods: {
            async createProject() {
                this.loading = true
                this.message = ''
                this.success = false
        
                try {
                    // const res = await this.$api.get('/container'); 
                    const res       = await this.$api.post('/projects', this.form)
                    this.message    = '✅ Property added successfully!'
                    this.success    = true
                    console.log('Created:', res.data)
            
                    // Reset form
                    this.form = {
                        name            : '',
                        location        : '',
                        description     : '',
                        project_type    : '',
                        completion_date : '',
                        total_units     : null,
                    }
                } catch (err) {
                    console.error(err)
                    this.message = '❌ Failed to add property.'
                    this.success = false
                } finally {
                    this.loading = false
                }
            },
		},
	}
	</script>
	
	<style lang="scss" scoped>
	.properties {
        max-width: 700px;
		padding: 20px;

        .card {
            border-radius: 10px;
        }
	}	
	</style>
	