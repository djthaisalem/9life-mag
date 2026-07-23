import * as migration_20260722_072701_initial_9life_schema from './20260722_072701_initial_9life_schema';
import * as migration_20260723_000001_user_playlist_sharing from './20260723_000001_user_playlist_sharing';

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
];
