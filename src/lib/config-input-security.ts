import 'server-only'

export function assertSafeConfigurationValues(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'string') continue

    if (/[\r\n\0]/.test(value)) {
      throw new Error(`unsafe_configuration_value:${key}`)
    }
  }
}

export function assertRuntimeConfigurationWritable() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('runtime_configuration_write_disabled')
  }
}
