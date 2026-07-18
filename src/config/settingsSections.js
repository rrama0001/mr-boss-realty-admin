export const SETTINGS_SECTIONS = [
    {
        id: 'company-info',
        label: 'Company Info',
        icon: 'ti ti-building-store',
        description: 'Public contact details, hours, and social links shown on the website',
    },
    {
        id: 'website',
        label: 'Website',
        icon: 'ti ti-world-cog',
        description: 'Public website display and pagination settings',
    },
    {
        id: 'ai-assistant',
        label: 'AI Assistant',
        icon: 'ti ti-robot',
        description: 'Model, prompts, and test chat',
    },
    {
        id: 'users',
        label: 'Users',
        icon: 'ti ti-users',
        description: 'Roles and login access',
        adminOnly: true,
    },
]
