export const defaultBranding = {
    name: import.meta.env.VITE_APP_NAME || 'Mr. Boss Realty',
    short_name: import.meta.env.VITE_APP_SHORT_NAME || 'Mr. Boss',
    tagline: import.meta.env.VITE_APP_TAGLINE || 'Management System',
}

export const appName = defaultBranding.name
export const appShortName = defaultBranding.short_name
export const appTagline = defaultBranding.tagline
