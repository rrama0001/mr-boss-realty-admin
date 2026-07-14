import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from './views/Dashboard.vue';
import Projects from './views/Projects.vue';
import ProjectDetailView from './views/ProjectDetailView.vue';
import BuildingUnitsView from './views/BuildingUnitsView.vue';
import Buildings from './views/Buildings.vue';
import Units from './views/Units.vue';
import Settings from './views/Settings.vue';
import Leads from './views/Leads.vue';
import Login from './views/Login.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', component: Login },
        { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
        { path: '/properties', component: Projects, meta: { requiresAuth: true } },
        { path: '/properties/:id', component: ProjectDetailView, meta: { requiresAuth: true } },
        { path: '/properties/:propertyId/buildings/:buildingId', component: BuildingUnitsView, meta: { requiresAuth: true } },
        { path: '/projects', redirect: '/properties' },
        { path: '/projects/:id', redirect: (to) => `/properties/${to.params.id}` },
        {
            path: '/projects/:projectId/buildings/:buildingId',
            redirect: (to) => `/properties/${to.params.projectId}/buildings/${to.params.buildingId}`,
        },
        { path: '/buildings', component: Buildings, meta: { requiresAuth: true } },
        { path: '/units', component: Units, meta: { requiresAuth: true } },
        { path: '/settings', component: Settings, meta: { requiresAuth: true } },
        { path: '/settings/ai', redirect: '/settings' },
        { path: '/settings/users', redirect: '/settings' },
        { path: '/ai-settings', redirect: '/settings' },
        { path: '/users', redirect: '/settings' },
        { path: '/leads', component: Leads, meta: { requiresAuth: true } },
        {
            path: '/logout',
            beforeEnter: () => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userRole');
                return '/login';
            },
        },
        {
            path: '/',
            redirect: () => {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                return isLoggedIn ? '/dashboard' : '/login';
            },
        },
    ],
});

router.beforeEach((to) => {
    if (!to.matched.some((r) => r.meta.requiresAuth)) return true;

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return '/login';

    return true;
});

export default router;
