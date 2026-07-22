import * as migration_20260722_072701_initial_9life_schema from './20260722_072701_initial_9life_schema';

export const migrations = [
  {
    up: migration_20260722_072701_initial_9life_schema.up,
    down: migration_20260722_072701_initial_9life_schema.down,
    name: '20260722_072701_initial_9life_schema'
  },
];
