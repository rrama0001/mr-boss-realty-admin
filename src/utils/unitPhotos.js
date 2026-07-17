/**
 * Unit-owned photos live under `projects/<projectId>/units/<unitId>/`,
 * either behind the API `/uploads` proxy or directly on the R2 public host.
 */
export function isUnitOwnedPhotoUrl(url) {
    return /(?:^|\/)projects\/\d+\/units\//i.test(String(url || ''));
}
