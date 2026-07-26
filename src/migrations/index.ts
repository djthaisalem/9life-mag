import * as migration_20260722_072701_initial_9life_schema from './20260722_072701_initial_9life_schema';
import * as migration_20260723_000001_user_playlist_sharing from './20260723_000001_user_playlist_sharing';
import * as migration_20260724_000001_referral_visit_counts from './20260724_000001_referral_visit_counts';
import * as migration_20260724_000002_track_download_control from './20260724_000002_track_download_control';
import * as migration_20260726_000001_artist_profile_draft from './20260726_000001_artist_profile_draft';
import * as migration_20260726_000002_outlet_profiles from './20260726_000002_outlet_profiles';

export const migrations = [
  {
    up: migration_20260722_072701_initial_9life_schema.up,
    down: migration_20260722_072701_initial_9life_schema.down,
    name: '20260722_072701_initial_9life_schema'
  },
  {
    up: migration_20260723_000001_user_playlist_sharing.up,
    down: migration_20260723_000001_user_playlist_sharing.down,
    name: '20260723_000001_user_playlist_sharing'
  },
  {
    up: migration_20260724_000001_referral_visit_counts.up,
    down: migration_20260724_000001_referral_visit_counts.down,
    name: '20260724_000001_referral_visit_counts'
  },
  {
    up: migration_20260724_000002_track_download_control.up,
    down: migration_20260724_000002_track_download_control.down,
    name: '20260724_000002_track_download_control'
  },
  {
    up: migration_20260726_000001_artist_profile_draft.up,
    down: migration_20260726_000001_artist_profile_draft.down,
    name: '20260726_000001_artist_profile_draft'
  },
  {
    up: migration_20260726_000002_outlet_profiles.up,
    down: migration_20260726_000002_outlet_profiles.down,
    name: '20260726_000002_outlet_profiles'
  },
];
