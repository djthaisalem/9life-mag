import type { CollectionConfig } from 'payload'

export const CmsAccessRequests: CollectionConfig = {
  slug: 'cms-access-requests',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'requestedRole', 'status', 'createdAt'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'organization', type: 'text' },
    { name: 'requestedRole', type: 'text', required: true },
    { name: 'note', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
}
