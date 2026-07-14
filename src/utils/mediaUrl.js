/**
 * Resolve uploaded media URLs for the admin app.
 * In dev, rewrites API-origin /uploads paths to same-origin so Vite can proxy them.
 */
export function resolveMediaUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const apiOrigin = apiBase.replace(/\/api\/?$/, '');

    if (value.startsWith(`${apiOrigin}/uploads/`)) {
        return value.slice(apiOrigin.length);
    }

    return value;
}
