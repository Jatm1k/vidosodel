import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
    { path: '/channels/:id', name: 'channel', component: () => import('./views/ChannelView.vue'), props: (r) => ({ id: Number(r.params.id) }) },
    { path: '/projects/:id', name: 'project', component: () => import('./views/ProjectView.vue'), props: (r) => ({ id: Number(r.params.id) }) },
    { path: '/series', name: 'series-list', component: () => import('./views/SeriesListView.vue') },
    { path: '/series/:id', name: 'series', component: () => import('./views/SeriesView.vue'), props: (r) => ({ id: Number(r.params.id) }) },
    { path: '/episodes/:id', name: 'episode', component: () => import('./views/EpisodeView.vue'), props: (r) => ({ id: Number(r.params.id) }) },
    { path: '/jobs', name: 'jobs', component: () => import('./views/JobsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
