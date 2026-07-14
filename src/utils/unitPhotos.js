export function isUnitOwnedPhotoUrl(url) {
    return /\/uploads\/projects\/\d+\/units\//i.test(String(url || ''));
}
