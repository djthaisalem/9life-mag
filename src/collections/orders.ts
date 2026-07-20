import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber'
  },
  fields: [
    {
      name: 'orderNumber',
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
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true
        },
        {
          name: 'price',
          type: 'number',
          required: true
        }
      ]
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' }
      ]
    },
    {
      name: 'paymentProvider',
      type: 'text'
    },
    {
      name: 'webhookIdempotencyKey',
      type: 'text'
    }
  ]
}
