import type { CollectionConfig } from 'payload'

export const BookingRequests: CollectionConfig = {
  slug: 'booking-requests',
  admin: {
    useAsTitle: 'eventName'
  },
  fields: [
    {
      name: 'eventName',
      type: 'text',
      required: true
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists'
    },
    {
      name: 'contactName',
      type: 'text',
      required: true
    },
    {
      name: 'contactEmail',
      type: 'email',
      required: true
    },
    {
      name: 'phone',
      type: 'text'
    },
    {
      name: 'eventDate',
      type: 'date'
    },
    {
      name: 'location',
      type: 'text'
    },
    {
      name: 'budget',
      type: 'number'
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Negotiating', value: 'negotiating' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' }
      ]
    },
    {
      name: 'notes',
      type: 'textarea'
    }
  ]
}
