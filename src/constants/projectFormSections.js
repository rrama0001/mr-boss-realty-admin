import { PROJECT_FIELD_HELP } from '@/constants/fieldHelp';

export const DEPRECATED_PROJECT_FIELD_VALUES = {
    showroom_location: null,
    loan_type: null,
    reservation_requirements: null,
};

export const PROJECT_FORM_SECTIONS = [
    {
        id: 'basics',
        title: 'Basics',
        fields: [
            { key: 'project_name', label: "Property Name/Owner's Name", required: true },
            { key: 'developer', label: 'Developer' },
            { key: 'city', label: 'City', required: true },
            { key: 'description', label: 'Description', type: 'textarea' },
        ],
    },
    {
        id: 'website',
        title: 'Website',
        websiteSettings: true,
    },
    {
        id: 'marketing',
        title: 'Marketing',
        fields: [
            { key: 'amenities', label: 'Amenities', type: 'textarea' },
            { key: 'images_videos_link', label: 'Images and Videos Link', type: 'url' },
            {
                key: 'developer_website',
                label: 'Developer Website',
                type: 'url',
                help: PROJECT_FIELD_HELP.developer_website,
            },
        ],
    },
    {
        id: 'ai',
        title: 'AI context',
        fields: [
            {
                key: 'developer_notes',
                label: 'Developer Notes',
                type: 'textarea',
                rows: 6,
                help: PROJECT_FIELD_HELP.developer_notes,
            },
        ],
    },
    {
        id: 'internal',
        title: 'Internal (admin & OTP)',
        fields: [
            { key: 'location', label: 'Street Address', help: PROJECT_FIELD_HELP.location },
            { key: 'contact_person', label: 'Contact Person', help: PROJECT_FIELD_HELP.contact_person },
            {
                key: 'contact_person_position',
                label: 'Contact Position',
                help: PROJECT_FIELD_HELP.contact_person_position,
            },
            { key: 'contact_person_number', label: 'Contact Number', help: PROJECT_FIELD_HELP.contact_person },
            {
                key: 'contact_person_email',
                label: 'Contact Email',
                type: 'email',
                help: PROJECT_FIELD_HELP.contact_person,
            },
        ],
    },
];

export function flattenProjectFormFields(sections = PROJECT_FORM_SECTIONS) {
    const fields = [];

    for (const section of sections) {
        if (section.fields) {
            fields.push(...section.fields);
        }
        if (section.websiteSettings) {
            fields.push({ key: 'slug', label: 'Website Slug', help: PROJECT_FIELD_HELP.slug });
        }
    }

    return fields;
}
