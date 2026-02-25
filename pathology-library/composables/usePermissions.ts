// Composable for permission checking
import { computed } from 'vue'
import { useAuth } from './useAuth'

export type UserRole = 'admin' | 'editor' | 'reviewer' | 'viewer'

export const usePermissions = () => {
    const { user, profile } = useAuth()

    const isLoggedIn = computed(() => !!user.value)

    const userRole = computed<UserRole>(() => {
        return (profile.value?.role as UserRole) || 'viewer'
    })

    const isAdmin = computed(() => userRole.value === 'admin')

    const isEditor = computed(() => ['admin', 'editor'].includes(userRole.value))

    const isReviewer = computed(() => ['admin', 'editor', 'reviewer'].includes(userRole.value))

    const canCreateCase = computed(() => isEditor.value)

    const canEditCase = computed(() => isEditor.value)

    const canReviewCase = computed(() => isReviewer.value)

    const canManageUsers = computed(() => isAdmin.value)

    const canManageCatalogs = computed(() => isEditor.value)

    const canAccessAdmin = computed(() => isReviewer.value)

    return {
        isLoggedIn,
        userRole,
        isAdmin,
        isEditor,
        isReviewer,
        canCreateCase,
        canEditCase,
        canReviewCase,
        canManageUsers,
        canManageCatalogs,
        canAccessAdmin
    }
}
