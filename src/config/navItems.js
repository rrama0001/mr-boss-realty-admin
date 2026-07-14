export const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: 'ti ti-layout-dashboard', iconTone: 'blue' },
    { to: '/properties', label: 'Properties', icon: 'ti ti-building-estate', iconTone: 'orange' },
    { to: '/units', label: 'Units', icon: 'ti ti-building', iconTone: 'cyan' },
    { to: '/leads', label: 'Leads', icon: 'ti ti-address-book', iconTone: 'green', adminOnly: true },
    { to: '/settings', label: 'Settings', icon: 'ti ti-settings', iconTone: 'slate' },
]

function navItemForPath(path) {
    return NAV_ITEMS.filter(
        (item) => path === item.to || path.startsWith(`${item.to}/`),
    ).sort((a, b) => b.to.length - a.to.length)[0]
}

export function navIconForPath(path) {
    return navItemForPath(path)?.icon || null
}

export function navIconToneForPath(path) {
    return navItemForPath(path)?.iconTone || 'blue'
}
