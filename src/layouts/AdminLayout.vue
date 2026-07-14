<template>
    <div>
        <div
            class="sidebar-backdrop d-lg-none"
            :class="{ show: sidebarBackdropVisible }"
            aria-hidden="true"
            @click="collapseSidebar"
        ></div>

        <div class="admin-layout">
            <aside class="navbar navbar-vertical navbar-expand-lg app-sidebar">
                <div class="container-fluid">
                    <button
                        class="navbar-toggler d-lg-none"
                        :class="{ collapsed: !sidebarOpen }"
                        type="button"
                        aria-controls="sidebar-menu"
                        :aria-expanded="sidebarOpen ? 'true' : 'false'"
                        aria-label="Toggle navigation"
                        @click="toggleMobileSidebar"
                    >
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <h1 class="navbar-brand">
                        <router-link to="/dashboard" class="text-decoration-none text-reset navbar-brand-link">
                            <img
                                :src="logoUrl"
                                :alt="appShortName"
                                class="navbar-brand-logo"
                            />
                            <span class="navbar-brand-text"></span>
                        </router-link>
                    </h1>

                    <div class="collapse navbar-collapse sidebar-mobile-panel" id="sidebar-menu">
                        <ul class="navbar-nav pt-lg-3">
                            <li v-for="item in menuItems" :key="item.to" class="nav-item">
                                <router-link :to="item.to" class="nav-link" active-class="active" @click="onNavClick">
                                    <span
                                        :class="[
                                            'nav-link-icon',
                                            'stat-icon',
                                            `stat-icon--${item.iconTone || 'blue'}`,
                                        ]"
                                    >
                                        <i :class="item.icon"></i>
                                    </span>
                                    <span class="nav-link-title">{{ item.label }}</span>
                                </router-link>
                            </li>
                        </ul>

                        <div class="mt-auto d-lg-none pb-3 sidebar-mobile-account">
                            <div class="dropdown">
                                <a
                                    href="#"
                                    class="nav-link d-flex lh-1 text-reset"
                                    data-bs-toggle="dropdown"
                                    aria-label="Open user menu"
                                    @click.prevent
                                >
                                    <span class="avatar avatar-sm bg-primary-lt">{{ userInitials }}</span>
                                    <div class="ps-2">
                                        <div>{{ fullName }}</div>
                                        <div class="mt-1 small text-secondary">{{ userEmail }}</div>
                                    </div>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                                    <a href="#" class="dropdown-item" @click.prevent="logout">
                                        <i class="ti ti-logout me-2"></i>Logout
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div class="page-wrapper">
                <header class="navbar navbar-expand-md d-none d-lg-flex d-print-none app-topbar">
                    <div class="container-fluid app-topbar__inner">
                        <div class="navbar-nav flex-row ms-auto">
                            <div class="nav-item dropdown">
                                <a
                                    href="#"
                                    class="nav-link d-flex lh-1 text-reset p-0"
                                    data-bs-toggle="dropdown"
                                    aria-label="Open user menu"
                                    @click.prevent
                                >
                                    <span class="avatar avatar-sm bg-primary-lt">{{ userInitials }}</span>
                                    <div class="d-none d-xl-block ps-2">
                                        <div>{{ fullName }}</div>
                                        <div class="mt-1 small text-secondary">{{ userEmail }}</div>
                                    </div>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                                    <a href="#" class="dropdown-item" @click.prevent="logout">
                                        <i class="ti ti-logout me-2"></i>Logout
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="page-body">
                    <div class="container-xl">
                        <slot />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { appShortName } from '@/config/app'
import logoUrl from '@/assets/images/mr-boss-realty-logo.png'

export default {
    name: 'AdminLayout',
    props: {
        menuItems: {
            type: Array,
            default: () => [],
        },
        fullName: {
            type: String,
            default: 'User',
        },
        userEmail: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            sidebarOpen: false,
            sidebarBackdropVisible: false,
            appShortName,
            logoUrl,
        }
    },
    computed: {
        userInitials() {
            const parts = (this.fullName || 'U').trim().split(/\s+/)
            return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || 'U'
        },
    },
    watch: {
        $route() {
            this.collapseSidebar()
        },
    },
    mounted() {
        this.bindSidebarCollapseEvents()
        this.prepareSidebarMenu()
        this.$nextTick(() => this.prepareSidebarMenu())
        this._onResize = () => this.prepareSidebarMenu()
        window.addEventListener('resize', this._onResize)
    },
    updated() {
        if (this.isDesktopSidebar()) {
            this.prepareSidebarMenu()
        }
    },
    beforeUnmount() {
        window.removeEventListener('resize', this._onResize)
        this.unbindSidebarCollapseEvents()
        this.clearSidebarBackdropTimer()
        document.body.classList.remove('sidebar-open')
    },
    methods: {
        logout() {
            this.$emit('logout')
        },
        isDesktopSidebar() {
            return window.matchMedia('(min-width: 992px)').matches
        },
        prepareSidebarMenu() {
            const menu = document.getElementById('sidebar-menu')
            if (!menu) return

            const Collapse = window.tabler?.Collapse
            if (Collapse) {
                Collapse.getInstance(menu)?.dispose()
            }

            menu.style.removeProperty('height')
            menu.style.removeProperty('display')

            if (this.isDesktopSidebar()) {
                menu.classList.remove('collapsing')
            }
        },
        toggleMobileSidebar() {
            if (this.isDesktopSidebar()) return

            const menu = document.getElementById('sidebar-menu')
            if (!menu) return

            if (menu.classList.contains('show')) {
                this.collapseSidebar()
                return
            }

            const Collapse = window.tabler?.Collapse
            if (Collapse) {
                Collapse.getOrCreateInstance(menu, { toggle: false }).show()
                return
            }

            menu.classList.add('show')
            this.sidebarOpen = true
            this.showSidebarBackdrop(menu)
        },
        bindSidebarCollapseEvents() {
            const menu = document.getElementById('sidebar-menu')
            if (!menu) return

            this._onSidebarShow = () => {
                this.sidebarOpen = true
            }
            this._onSidebarShown = () => {
                this.showSidebarBackdrop(menu)
            }
            this._onSidebarHide = () => {
                this.hideSidebarBackdrop()
            }
            menu.addEventListener('show.bs.collapse', this._onSidebarShow)
            menu.addEventListener('shown.bs.collapse', this._onSidebarShown)
            menu.addEventListener('hide.bs.collapse', this._onSidebarHide)
        },
        unbindSidebarCollapseEvents() {
            const menu = document.getElementById('sidebar-menu')
            if (!menu || !this._onSidebarShow) return

            menu.removeEventListener('show.bs.collapse', this._onSidebarShow)
            menu.removeEventListener('shown.bs.collapse', this._onSidebarShown)
            menu.removeEventListener('hide.bs.collapse', this._onSidebarHide)
            if (this._onSidebarTransitionEnd) {
                menu.removeEventListener('transitionend', this._onSidebarTransitionEnd)
            }
        },
        showSidebarBackdrop(menu) {
            this.clearSidebarBackdropTimer()

            const reveal = () => {
                if (!menu.classList.contains('show')) return
                this.sidebarBackdropVisible = true
                document.body.classList.add('sidebar-open')
            }

            this._onSidebarTransitionEnd = (event) => {
                if (event.target !== menu || event.propertyName !== 'transform') return
                menu.removeEventListener('transitionend', this._onSidebarTransitionEnd)
                this._onSidebarTransitionEnd = null
                reveal()
            }

            menu.addEventListener('transitionend', this._onSidebarTransitionEnd)
            this._backdropFallback = window.setTimeout(() => {
                if (this._onSidebarTransitionEnd) {
                    menu.removeEventListener('transitionend', this._onSidebarTransitionEnd)
                    this._onSidebarTransitionEnd = null
                }
                reveal()
            }, 280)
        },
        hideSidebarBackdrop() {
            this.clearSidebarBackdropTimer()
            this.sidebarOpen = false
            this.sidebarBackdropVisible = false
            document.body.classList.remove('sidebar-open')
        },
        clearSidebarBackdropTimer() {
            if (this._backdropFallback) {
                clearTimeout(this._backdropFallback)
                this._backdropFallback = null
            }
        },
        onNavClick() {
            this.closeMobileSidebar()
        },
        closeMobileSidebar() {
            if (this.isDesktopSidebar()) return
            this.collapseSidebar()
        },
        collapseSidebar() {
            const menu = document.getElementById('sidebar-menu')
            if (!menu || !menu.classList.contains('show')) return

            this.hideSidebarBackdrop()

            const Collapse = window.tabler?.Collapse
            if (Collapse) {
                const instance = Collapse.getInstance(menu) || Collapse.getOrCreateInstance(menu, { toggle: false })
                instance.hide()
                return
            }

            menu.classList.remove('show', 'collapsing')
            menu.classList.add('collapse')
        },
    },
}
</script>
