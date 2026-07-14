<template>
    <div id="app">
        <div v-if="loading" class="d-flex justify-content-center align-items-center vh-100">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <AdminLayout
            v-else-if="isLoggedIn"
            :menu-items="menuItems"
            :full-name="fullName"
            :user-email="userEmail"
            @logout="logout"
        >
            <router-view />
        </AdminLayout>

        <AuthLayout v-else>
            <router-view />
        </AuthLayout>

        <ConfirmDeleteModal />
        <AppAlertModal />
    </div>
</template>

<script>
import api from '@/plugins/axios'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import AppAlertModal from '@/components/AppAlertModal.vue'
import { NAV_ITEMS } from '@/config/navItems'
import { appName } from '@/config/app'

export default {
    name: 'App',
    components: {
        AdminLayout,
        AuthLayout,
        ConfirmDeleteModal,
        AppAlertModal,
    },
    data() {
        return {
            isLoggedIn: false,
            userRole: null,
            fullName: 'User',
            userEmail: '',
            loading: true,
        }
    },
    computed: {
        menuItems() {
            return NAV_ITEMS.filter((item) => !item.adminOnly || this.userRole === 'admin')
        },
    },
    async created() {
        document.title = appName
        await this.initializeAuth()
    },
    methods: {
        applyUserSession(user) {
            this.isLoggedIn = true
            this.userRole = user?.role || null
            this.fullName = user?.username || 'User'
            this.userEmail = user?.email || ''
            localStorage.setItem('isLoggedIn', 'true')
            localStorage.setItem('userRole', this.userRole || '')
            localStorage.setItem('userName', this.fullName)
            localStorage.setItem('userEmail', this.userEmail)
        },
        clearUserSession() {
            this.isLoggedIn = false
            this.userRole = null
            this.fullName = 'User'
            this.userEmail = ''
            localStorage.removeItem('isLoggedIn')
            localStorage.removeItem('userRole')
            localStorage.removeItem('userName')
            localStorage.removeItem('userEmail')
        },
        async initializeAuth() {
            const storedLogin = localStorage.getItem('isLoggedIn') === 'true'
            const storedRole = localStorage.getItem('userRole')
            const storedName = localStorage.getItem('userName')
            const storedEmail = localStorage.getItem('userEmail')

            if (storedLogin && storedRole) {
                this.isLoggedIn = true
                this.userRole = storedRole
                this.fullName = storedName || 'User'
                this.userEmail = storedEmail || ''
                this.loading = false

                if (!storedEmail) {
                    api.get('/auth/status').then((res) => {
                        if (res.data.loggedIn) {
                            this.applyUserSession(res.data.user)
                        }
                    }).catch(() => {})
                }

                if (this.$route.path === '/login') {
                    this.$router.replace('/dashboard')
                }
                return
            }

            try {
                const res = await api.get('/auth/status')
                if (res.data.loggedIn) {
                    this.applyUserSession(res.data.user)
                    if (this.$route.path === '/login') {
                        this.$router.replace('/dashboard')
                    }
                } else {
                    this.clearUserSession()
                }
            } catch (err) {
                this.clearUserSession()
            } finally {
                this.loading = false
            }
        },
        async logout() {
            try {
                await api.get('/auth/logout')
            } catch (err) {
                console.error(err)
            }

            this.clearUserSession()
            this.$router.replace('/login')
        },
    },
}
</script>
