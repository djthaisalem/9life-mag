import type { CollectionConfig } from 'payload'

export const WalletLedger: CollectionConfig = {
  slug: 'wallet-ledger',
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'userId', 'eventType', 'amount', 'balanceAfter', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
    },
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Signup Bonus', value: 'signup_bonus' },
        { label: 'Daily Claim', value: 'daily_claim' },
        { label: 'Bonus Claim', value: 'bonus_claim' },
        { label: 'Playlist Reward', value: 'playlist_reward' },
        { label: 'Share Reward', value: 'share_reward' },
        { label: 'Topup Approved', value: 'topup_approved' },
        { label: 'Spend General', value: 'spend_general' },
        { label: 'Spend Vote', value: 'spend_vote' },
        { label: 'Spend Playback', value: 'spend_playback' },
        { label: 'Spend Download', value: 'spend_download' },
        { label: 'Manual Adjustment', value: 'manual_adjustment' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'balanceAfter',
      type: 'number',
      required: true,
    },
    {
      name: 'note',
      type: 'textarea',
    },
  ],
}
