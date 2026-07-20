import type { CollectionConfig } from 'payload'

export const AgentChangeTickets: CollectionConfig = {
  slug: 'agent-change-tickets',
  admin: { useAsTitle: 'newAgent' },
  fields: [
    { name: 'artistAccountId', type: 'text', required: true },
    { name: 'oldAgent', type: 'text', required: true },
    { name: 'newAgent', type: 'text', required: true },
    { name: 'reason', type: 'textarea' },
    { name: 'status', type: 'select', required: true, defaultValue: 'pending', options: ['pending', 'approved', 'rejected'] },
    { name: 'oldAgentDecision', type: 'select', options: ['pending', 'accepted', 'rejected', 'not_required'] },
    { name: 'newAgentDecision', type: 'select', options: ['pending', 'accepted', 'rejected', 'not_required'] },
    { name: 'appealNote', type: 'textarea' },
  ],
}
