import { WEBSITE_PRIVATE_PROPERTY_LABEL } from '@/constants/privateProperty';

export function slugifyPart(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function getProjectSlugName(projectName, isPrivateOnWebsite = false) {
    if (isPrivateOnWebsite) {
        return WEBSITE_PRIVATE_PROPERTY_LABEL;
    }

    return projectName;
}

export function buildProjectSlug(projectName, city, isPrivateOnWebsite = false) {
    const parts = [
        slugifyPart(getProjectSlugName(projectName, isPrivateOnWebsite)),
        slugifyPart(city),
    ].filter(Boolean);

    return parts.join('-') || 'property';
}
