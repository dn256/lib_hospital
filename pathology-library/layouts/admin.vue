<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '~/composables/usePermissions'
import { useAuth } from '~/composables/useAuth'

const { profile } = useAuth()
const { isAdmin, isEditor, canManageUsers, canManageCatalogs } = usePermissions()
const route = useRoute()

// Navigation items based on permissions
const navItems = computed(() => {
    const items = [
        {
            title: 'Dashboard',
            icon: 'mdi-view-dashboard',
            to: '/admin',
            show: true
        },
        {
            title: 'Quản lý Cases',
            icon: 'mdi-file-document-multiple',
            to: '/admin/cases',
            show: true
        },
        {
            title: 'Duyệt Cases',
            icon: 'mdi-check-decagram',
            to: '/admin/review',
            show: true
        },
        {
            title: 'Danh mục',
            icon: 'mdi-folder-table',
            to: '/admin/catalogs',
            show: canManageCatalogs.value
        },
        {
            title: 'Người dùng',
            icon: 'mdi-account-group',
            to: '/admin/users',
            show: canManageUsers.value
        },
    ]
    return items.filter(item => item.show)
})

const isActiveRoute = (path: string) => {
    if (path === '/admin') {
        return route.path === '/admin'
    }
    return route.path.startsWith(path)
}
</script>

<template>
    <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <NuxtLink to="/" class="logo-link">
                    <div class="logo-icon">
                        <v-icon color="white" size="20">mdi-microscope</v-icon>
                    </div>
                    <div class="logo-text">
                        <span class="logo-name">PathologyLib</span>
                        <span class="logo-role">{{ profile?.role || 'Admin' }}</span>
                    </div>
                </NuxtLink>
            </div>

            <nav class="sidebar-nav">
                <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item"
                    :class="{ active: isActiveRoute(item.to) }">
                    <v-icon size="20" class="nav-icon">{{ item.icon }}</v-icon>
                    <span class="nav-text">{{ item.title }}</span>
                </NuxtLink>
            </nav>

            <div class="sidebar-footer">
                <NuxtLink to="/" class="nav-item">
                    <v-icon size="20" class="nav-icon">mdi-home</v-icon>
                    <span class="nav-text">Về trang chủ</span>
                </NuxtLink>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="admin-main">
            <header class="admin-header">
                <div class="header-left">
                    <h1 class="page-title">
                        <slot name="title">Quản lý</slot>
                    </h1>
                </div>
                <div class="header-right">
                    <div class="user-info">
                        <v-avatar size="36" color="primary">
                            <span class="text-white text-body-2">
                                {{ profile?.display_name?.charAt(0)?.toUpperCase() || 'U' }}
                            </span>
                        </v-avatar>
                        <div class="user-details">
                            <span class="user-name">{{ profile?.display_name || 'User' }}</span>
                            <span class="user-role">{{ profile?.role || 'viewer' }}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="admin-content">
                <slot />
            </div>
        </main>
    </div>
</template>

<style scoped>
.admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f5f7fa;
}

/* Sidebar */
.admin-sidebar {
    width: 260px;
    background: linear-gradient(180deg, #1a365d 0%, #0f3460 100%);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
}

.logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #c9a227, #d4af37);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-text {
    display: flex;
    flex-direction: column;
}

.logo-name {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
}

.logo-role {
    font-size: 0.7rem;
    color: #c9a227;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
}

.nav-item.active {
    background: rgba(201, 162, 39, 0.15);
    color: #c9a227;
    border-left-color: #c9a227;
}

.nav-icon {
    opacity: 0.8;
}

.nav-item.active .nav-icon {
    opacity: 1;
}

.nav-text {
    font-size: 0.9rem;
    font-weight: 500;
}

.sidebar-footer {
    padding: 1rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Main Content */
.admin-main {
    flex: 1;
    margin-left: 260px;
    display: flex;
    flex-direction: column;
}

.admin-header {
    background: white;
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 50;
}

.page-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a365d;
    margin: 0;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a365d;
}

.user-role {
    font-size: 0.75rem;
    color: #666;
    text-transform: capitalize;
}

.admin-content {
    flex: 1;
    padding: 2rem;
}

/* Responsive */
@media (max-width: 1024px) {
    .admin-sidebar {
        width: 70px;
    }

    .sidebar-header .logo-text,
    .nav-text,
    .user-details {
        display: none;
    }

    .nav-item {
        justify-content: center;
        padding: 1rem;
    }

    .admin-main {
        margin-left: 70px;
    }
}
</style>
