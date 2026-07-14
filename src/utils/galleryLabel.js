export function defaultGalleryLabelFromFilename(filename) {
    const base = String(filename || '')
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return base.slice(0, 80);
}

export function galleryImageDisplayLabel(image, fallbackId = '') {
    const label = String(image?.label || '').trim();
    if (label) return label;
    if (fallbackId) return `Image ${fallbackId}`;
    return 'Untitled image';
}
