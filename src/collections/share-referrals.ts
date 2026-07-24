import type { CollectionConfig } from 'payload'

export const ShareReferrals: CollectionConfig = {
  slug: 'share-referrals',
  admin: { useAsTitle: 'token', defaultColumns: ['ownerId', 'path', 'status', 'createdAt'] },
  fields: [
    { name: 'ownerId', type: 'text', required: true, index: true },
    { name: 'token', type: 'text', required: true, unique: true },
    { name: 'path', type: 'text', required: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'pending', options: [{ label: 'Pending', value: 'pending' }, { label: 'Visited', value: 'visited' }, { label: 'Rewarded', value: 'rewarded' }, { label: 'Rejected', value: 'rejected' }] },
    { name: 'visitorFingerprint', type: 'text' },
    { name: 'visitorFingerprints', type: 'json', admin: { readOnly: true } },
    { name: 'visitCount', type: 'number', defaultValue: 0, min: 0, admin: { readOnly: true } },
    { name: 'visitedAt', type: 'date' },
    { name: 'rewardedAt', type: 'date' },
  ],
}
