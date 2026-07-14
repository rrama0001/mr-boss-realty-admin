import {
    buildListingDetailPath,
    buildPropertyDetailPath,
    getProjectUrlSegments,
} from '@/utils/propertyPublicUrl';

const PUBLIC_SITE_URL = (
    import.meta.env.VITE_WEBSITE_URL
    || import.meta.env.VITE_PUBLIC_SITE_URL
    || 'https://www.mrbossrealty.com'
).replace(/\/$/, '');

export { PUBLIC_SITE_URL };

export function getPublicPropertyUrl(project = {}) {
    if (!project || typeof project === 'string') {
        if (!project) return `${PUBLIC_SITE_URL}/properties`;
        return `${PUBLIC_SITE_URL}/properties/${project}`;
    }

    return `${PUBLIC_SITE_URL}${buildPropertyDetailPath(project)}`;
}

export function getPublicBuildingUrl(project = {}, listingRef = '') {
    if (typeof project === 'string') {
        return getPublicUnitUrl(project, listingRef);
    }

    return `${PUBLIC_SITE_URL}${buildListingDetailPath(project, listingRef)}`;
}

export function getPublicUnitUrl(project = {}, unitRef = '') {
    if (!unitRef && project && typeof project === 'object' && project.slug && !project.city) {
        return getPublicPropertyUrl(project);
    }

    if (typeof project === 'string') {
        const projectSlug = project;
        if (!projectSlug || unitRef == null || unitRef === '') {
            return `${PUBLIC_SITE_URL}/properties`;
        }

        return `${PUBLIC_SITE_URL}/properties/${projectSlug}/${unitRef}`;
    }

    return `${PUBLIC_SITE_URL}${buildListingDetailPath(project, unitRef)}`;
}

export function getPublicPropertyUrlFromSlug(slug, city, isPrivateOnWebsite = false) {
    return `${PUBLIC_SITE_URL}${buildPropertyDetailPath({
        slug,
        city,
        is_private_on_website: isPrivateOnWebsite,
    })}`;
}

export function describePublicPropertyUrl(project = {}) {
    const { citySlug, projectSlug } = getProjectUrlSegments(project);
    if (!citySlug || !projectSlug) return '/properties';
    return `/properties/${citySlug}/${projectSlug}`;
}
