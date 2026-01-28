// useAuth composable - Nuxt auto-imports useState

import { useState } from "nuxt/app"
import { useSupabaseClient } from "./useSupabaseClient"

export const useAuth = () => {
    const supabase = useSupabaseClient()
    const user = useState<any>('user', () => null)

    const init = async () => {
        const { data } = await supabase.auth.getSession()
        user.value = data.session?.user ?? null
        supabase.auth.onAuthStateChange((_event, session) => {
            user.value = session?.user ?? null
        })
    }

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    return { user, init, signInWithPassword, signOut }
}
