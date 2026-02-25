// useAuth composable - Nuxt auto-imports useState

import { useState } from "nuxt/app"
import { useSupabaseClient } from "./useSupabaseClient"

export interface UserProfile {
    user_id: string
    display_name: string | null
    role: string
    created_at: string
    updated_at: string
}

export const useAuth = () => {
    const supabase = useSupabaseClient()
    const user = useState<any>('user', () => null)
    const profile = useState<UserProfile | null>('profile', () => null)

    const init = async () => {
        const { data } = await supabase.auth.getSession()
        user.value = data.session?.user ?? null

        // Load profile if user is logged in
        if (user.value) {
            await loadProfile()
        }

        supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            user.value = session?.user ?? null

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user && !profile.value) {
                    await loadProfile()
                }
            } else if (event === 'SIGNED_OUT') {
                profile.value = null
            }
        })

        // Re-check session when user returns to the tab after being away
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible') {
                    const { data: { session } } = await supabase.auth.getSession()
                    user.value = session?.user ?? null
                    if (session?.user && !profile.value) {
                        await loadProfile()
                    }
                }
            })
        }
    }

    const loadProfile = async () => {
        if (!user.value) return null

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.value.id)
            .maybeSingle()

        if (error) {
            console.error('Error loading profile:', error)
            return null
        }

        profile.value = data
        return data
    }

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signUp = async (email: string, password: string, displayName?: string) => {
        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || email.split('@')[0]
                }
            }
        })
        if (error) throw error

        // 2. Create profile record (if user was created successfully)
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    user_id: data.user.id,
                    display_name: displayName || email.split('@')[0]
                })

            if (profileError) {
                console.error('Error creating profile:', profileError)
                // Don't throw - user is created, profile can be created later
            }
        }

        return data
    }

    const updateProfile = async (updates: Partial<Pick<UserProfile, 'display_name'>>) => {
        if (!user.value) throw new Error('Not authenticated')

        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.value.id)
            .select()
            .single()

        if (error) throw error

        profile.value = data
        return data
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        profile.value = null
    }

    return {
        user,
        profile,
        init,
        loadProfile,
        signInWithPassword,
        signUp,
        updateProfile,
        signOut
    }
}
