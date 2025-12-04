import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
    },/*
    {
        path: 'dashboard',
        loadChildren: () => import('./snippets/snippets.routes').then(m => m.snippetsRoutes),
        canActivate: [authGuard]
    },
    {
        path: 'public',
        loadChildren: () => import('./public/public.routes').then(m => m.publicRoutes)
    },
    {
        path: 'profile',
        loadChildren: () => import('./profile/profile.routes').then(m => m.profileRoutes),
        canActivate: [authGuard]
    },*/
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];
