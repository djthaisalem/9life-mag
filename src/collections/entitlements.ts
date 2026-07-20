import type { CollectionConfig } from 'payload'

export const Entitlements: CollectionConfig = {
  slug: 'entitlements',
  admin: {
    useAsTitle: 'code'
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders'
    },
    {
      name: 'downloadsRemaining',
      type: 'number',
      defaultValue: 3
    },
    {
      name: 'expiresAt',
      type: 'date'
    },
    {
      name: 'signedUrl',
      type: 'text'
    }
  ]
}
