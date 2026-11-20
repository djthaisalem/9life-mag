async function migrateAuthSchema(client) {
  await client.query('BEGIN')
  try {
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone')
    await client.query('SELECT "id", "hash", "salt", "reset_password_requested_at" FROM "users" LIMIT 0')
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

module.exports = { migrateAuthSchema }
