import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-list/public-list.component').then(m => m.PublicListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./public-detail/public-detail.component').then(m => m.PublicDetailComponent)
  }
];