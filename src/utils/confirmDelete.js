import { reactive } from 'vue';

export const deleteConfirmState = reactive({
    payload: null,
});

/**
 * Show a modal confirmation before destructive deletes.
 * @param {string} label - What is being deleted (e.g. "property Tower A")
 * @returns {Promise<boolean>}
 */
export function confirmDelete(label) {
    return new Promise((resolve) => {
        deleteConfirmState.payload = { label, resolve };
    });
}

export function resolveDeleteConfirm(confirmed) {
    const { resolve } = deleteConfirmState.payload || {};
    deleteConfirmState.payload = null;
    if (resolve) {
        resolve(confirmed);
    }
}
