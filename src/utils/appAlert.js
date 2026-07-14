import { reactive } from 'vue';

export const appAlertState = reactive({
    payload: null,
});

/**
 * Show a modal alert (styled like delete confirmation).
 * @param {string} message
 * @param {string} [title='Error']
 * @returns {Promise<void>}
 */
export function showAppAlert(message, title = 'Error') {
    return new Promise((resolve) => {
        appAlertState.payload = { title, message, resolve };
    });
}

export function resolveAppAlert() {
    const { resolve } = appAlertState.payload || {};
    appAlertState.payload = null;
    if (resolve) {
        resolve();
    }
}

export function getApiErrorMessage(err, fallback) {
    return err?.response?.data?.error || err?.message || fallback;
}
