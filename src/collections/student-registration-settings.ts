import type { CollectionConfig } from 'payload'

export const StudentRegistrationSettings: CollectionConfig = {
  slug: 'student-registration-settings',
  admin: { useAsTitle: 'targetSlug' },
  fields: [
    { name: 'targetType', type: 'select', required: true, options: [{ label: 'Artist', value: 'artist' }, { label: 'Agent', value: 'agent' }] },
    { name: 'targetSlug', type: 'text', required: true },
    { name: 'enabled', type: 'checkbox', required: true, defaultValue: false },
  ],
}
