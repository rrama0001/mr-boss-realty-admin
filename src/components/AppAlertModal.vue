<template>
    <ModalShell v-if="alertPayload" size="sm" class="app-alert-modal">
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title text-danger d-flex align-items-center">
                <i class="ti ti-alert-circle me-2" aria-hidden="true"></i>
                {{ alertPayload.title }}
            </h5>
            <button type="button" class="btn-close" aria-label="Close" @click="close"></button>
        </div>
        <div class="modal-body">
            <p class="mb-0">{{ alertPayload.message }}</p>
        </div>
        <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-primary" @click="close">OK</button>
        </div>
    </ModalShell>
</template>

<script>
import ModalShell from '@/components/ModalShell.vue';
import { appAlertState, resolveAppAlert } from '@/utils/appAlert';

export default {
    name: 'AppAlertModal',
    components: { ModalShell },
    computed: {
        alertPayload() {
            return appAlertState.payload;
        },
    },
    methods: {
        close() {
            resolveAppAlert();
        },
    },
};
</script>
