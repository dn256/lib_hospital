// Middleware to check authentication and role-based access
export default defineNuxtRouteMiddleware(async (to, from) => {
    // Supabase stores the browser session in localStorage in this application.
    // Defer the guard to hydration so a direct reload can recover that session.
    if (import.meta.server) return

    const { user, profile, loadProfile } = useAuth()
    const supabase = useSupabaseClient()

    // Try to recover session if user state is empty
    if (!user.value) {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
            user.value = data.session.user
        }
    }

    // If still no user after session recovery, redirect to login
    if (!user.value) {
        return navigateTo({
            path: '/login',
            query: { redirect: to.fullPath }
        })
    }

    // Check for admin/editor routes
    const adminRoutes = ['/admin']
    const isAdminRoute = adminRoutes.some(route => to.path.startsWith(route))

    if (isAdminRoute) {
        // Load profile if not available
        if (!profile.value) {
            await loadProfile()
        }

        const userRole = profile.value?.role || 'viewer'
        const allowedRoles = ['admin', 'editor', 'reviewer']

        if (!allowedRoles.includes(userRole)) {
            // User doesn't have permission
            return navigateTo('/')
        }
    }
})
