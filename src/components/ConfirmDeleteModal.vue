<template>
    <ModalShell v-if="deleteConfirm" size="sm" class="confirm-delete-modal">
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title text-danger d-flex align-items-center">
                <i class="ti ti-alert-triangle me-2"></i>
                Confirm Delete
            </h5>
            <button type="button" class="btn-close" aria-label="Close" @click="cancel"></button>
        </div>
        <div class="modal-body">
            <p class="mb-2">
                Are you sure you want to delete <strong>{{ deleteConfirm.label }}</strong>?
            </p>
            <p class="text-secondary mb-0 small">This action cannot be undone.</p>
        </div>
        <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
            <button type="button" class="btn btn-danger d-inline-flex align-items-center" @click="confirm">
                <i class="ti ti-trash me-1"></i>
                Delete
            </button>
        </div>
    </ModalShell>
</template>

<script>
import ModalShell from '@/components/ModalShell.vue';
import { deleteConfirmState, resolveDeleteConfirm } from '@/utils/confirmDelete';

export default {
    name: 'ConfirmDeleteModal',
    components: { ModalShell },
    computed: {
        deleteConfirm() {
            return deleteConfirmState.payload;
        },
    },
    methods: {
        confirm() {
            resolveDeleteConfirm(true);
        },
        cancel() {
            resolveDeleteConfirm(false);
        },
    },
};
</script>
