import type { CollectionConfig } from 'payload'

export const RequestGuards: CollectionConfig = {
  slug: 'request-guards',
  admin: {
    useAsTitle: 'scope',
    defaultColumns: ['scope', 'fingerprint', 'attemptCount', 'updatedAt'],
  },
  fields: [
    {
      name: 'scope',
      type: 'text',
      required: true,
    },
    {
      name: 'fingerprint',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'attemptTimestamps',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'attemptCount',
      type: 'number',
      defaultValue: 0,
      required: true,
    },
  ],
}
