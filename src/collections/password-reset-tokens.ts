import type { CollectionConfig } from 'payload'

export const PasswordResetTokens: CollectionConfig = {
  slug: 'password-reset-tokens',
  admin: {
    useAsTitle: 'identity',
    defaultColumns: ['identity', 'accountType', 'expiresAt', 'usedAt', 'createdAt'],
  },
  fields: [
    { name: 'tokenHash', type: 'text', required: true, unique: true },
    { name: 'identity', type: 'text', required: true },
    {
      name: 'accountType',
      type: 'select',
      required: true,
      options: [
        { label: 'User', value: 'user' },
        { label: 'Artist', value: 'artist' },
      ],
    },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'usedAt', type: 'date' },
  ],
}
