import hmmdDataset from '../data/hmmd-data.json'

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization')
  if (!authorization?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.public.supabaseUrl || '')
  const supabaseAnonKey = String(config.public.supabaseAnonKey || '')
  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase is not configured' })
  }

  try {
    await $fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        authorization,
      },
    })
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }

  setHeader(event, 'Cache-Control', 'private, max-age=300')
  return hmmdDataset
})
