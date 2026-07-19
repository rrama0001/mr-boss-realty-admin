/**
 * Unit-owned photos live under `projects/<projectId>/units/<unitId>/`,
 * either behind the API `/uploads` proxy or directly on the R2 public host.
 */
export function isUnitOwnedPhotoUrl(url) {
    return /(?:^|\/)projects\/\d+\/units\//i.test(String(url || ''));
}

/** Stable compare key across API/R2 host differences. */
export function unitPhotoKey(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    const match = value.match(/projects\/\d+\/units\/[^?#]+/i);
    return (match ? match[0] : value).toLowerCase();
}
