import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: any = null

export const useSupabaseClient = () => {
    const config = useRuntimeConfig()
    if (!_client) {
        _client = createClient(
            config.public.supabaseUrl as string,
            config.public.supabaseAnonKey as string,
            {
                db: { schema: 'lib_hospital' },
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    storageKey: 'lib-hospital-auth',
                    detectSessionInUrl: true,
                    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                }
            }
        )
    }
    return _client!
}
