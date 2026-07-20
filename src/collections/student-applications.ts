import type { CollectionConfig } from 'payload'

export const StudentApplications: CollectionConfig = {
  slug: 'student-applications',
  admin: { useAsTitle: 'fullName', defaultColumns: ['fullName', 'targetName', 'targetType', 'status', 'createdAt'] },
  fields: [
    { name: 'targetType', type: 'select', required: true, options: [{ label: 'Artist', value: 'artist' }, { label: 'Agent', value: 'agent' }] },
    { name: 'targetSlug', type: 'text', required: true },
    { name: 'targetName', type: 'text', required: true },
    { name: 'fullName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'city', type: 'text' },
    { name: 'experience', type: 'textarea' },
    { name: 'learningGoal', type: 'textarea', required: true },
    { name: 'availability', type: 'text' },
    { name: 'referenceLink', type: 'text' },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', options: [{ label: 'New', value: 'new' }, { label: 'Accepted', value: 'accepted' }, { label: 'Declined', value: 'declined' }] },
  ],
}
