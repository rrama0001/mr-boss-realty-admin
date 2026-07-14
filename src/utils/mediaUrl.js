/**
 * Resolve uploaded media URLs for the admin app.
 * - Rewrites legacy `/api/uploads/` → `/uploads/` (uploads are not under /api).
 * - In dev only, rewrites API-origin `/uploads` paths to same-origin so Vite can proxy them.
 */
export function resolveMediaUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';

    const normalized = value.replace(/\/api\/uploads\//gi, '/uploads/');

    if (import.meta.env.DEV) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiOrigin = apiBase.replace(/\/api\/?$/, '');

        if (normalized.startsWith(`${apiOrigin}/uploads/`)) {
            return normalized.slice(apiOrigin.length);
        }
    }

    return normalized;
}
