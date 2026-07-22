import type { CollectionConfig } from 'payload'

export const StarTopups: CollectionConfig = {
  slug: 'star-topups',
  admin: {
    useAsTitle: 'transactionRef',
    defaultColumns: ['transactionRef', 'userName', 'provider', 'amount', 'stars', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'transactionRef',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'providerOrderId',
      type: 'text',
      unique: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      // Keep the external account key separate from Payload's `user` relation.
      name: 'siteUserId',
      type: 'text',
      required: true,
    },
    {
      name: 'userName',
      type: 'text',
      required: true,
    },
    {
      name: 'userEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'packageId',
      type: 'text',
      required: true,
    },
    {
      name: 'packageTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'Bank QR', value: 'bank_qr' },
        { label: 'MoMo', value: 'momo' },
        { label: 'Viettel Money', value: 'viettel_money' },
        { label: 'PayPal', value: 'paypal' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'stars',
      type: 'number',
      required: true,
    },
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
    {
      name: 'note',
      type: 'textarea',
    },
    {
      name: 'qrUrl',
      type: 'text',
    },
    {
      name: 'actionUrl',
      type: 'text',
    },
    {
      name: 'providerMessage',
      type: 'textarea',
      required: true,
    },
    {
      name: 'userNotice',
      type: 'textarea',
      required: true,
    },
    {
      name: 'reviewedAt',
      type: 'date',
    },
  ],
}
