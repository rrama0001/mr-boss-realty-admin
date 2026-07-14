import { buildProjectSlug } from '@/utils/projectSlug';

export const PUBLIC_PRIVATE_PROJECT_SEGMENT = 'private-property';

export function cityToSlug(city = '') {
    return String(city)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function deriveNameSegmentFromDbSlug(dbSlug, city) {
    const citySlug = cityToSlug(city);
    if (!dbSlug) return 'property';
    if (!citySlug) return dbSlug;

    const suffix = `-${citySlug}`;
    if (dbSlug.endsWith(suffix)) {
        return dbSlug.slice(0, -suffix.length) || 'property';
    }

    const pattern = new RegExp(`^(.+)${suffix.replace(/-/g, '\\-')}-(\\d+)$`);
    const match = dbSlug.match(pattern);
    if (match) {
        return `${match[1]}-${match[2]}`;
    }

    return dbSlug;
}

export function getProjectUrlSegments(project = {}) {
    const citySlug = cityToSlug(project.city);
    if (project.is_private_on_website) {
        return {
            citySlug,
            projectSlug: PUBLIC_PRIVATE_PROJECT_SEGMENT,
        };
    }

    const dbSlug = project.slug
        || buildProjectSlug(project.project_name, project.city, project.is_private_on_website);

    return {
        citySlug,
        projectSlug: deriveNameSegmentFromDbSlug(dbSlug, project.city),
    };
}

export function buildPropertyDetailPath(project = {}) {
    const { citySlug, projectSlug } = getProjectUrlSegments(project);
    if (!citySlug || !projectSlug) return '/properties';
    return `/properties/${citySlug}/${projectSlug}`;
}

export function buildListingDetailPath(project = {}, listingRef = '') {
    const ref = String(listingRef || '').trim();
    if (!ref) return buildPropertyDetailPath(project);

    const { citySlug, projectSlug } = getProjectUrlSegments(project);
    if (!citySlug || !projectSlug) return '/properties';
    return `/properties/${citySlug}/${projectSlug}/${ref}`;
}
