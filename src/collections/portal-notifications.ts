import type { CollectionConfig } from 'payload'

export const PortalNotifications: CollectionConfig = {
  slug: 'portal-notifications',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'recipientKey', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'href', type: 'text' },
    { name: 'ticketId', type: 'text' },
    { name: 'isRead', type: 'checkbox', defaultValue: false },
  ],
}
