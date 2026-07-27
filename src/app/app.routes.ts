import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/public/shop/shop.component').then(m => m.ShopComponent),
  },
  {
    path: 'loan-request',
    loadComponent: () =>
      import('./features/public/loan-request/loan-request.component').then(m => m.LoanRequestComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['admin', 'manager', 'supervisor', 'senior_manager', 'executive'] },
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/products.component').then(m => m.ProductsComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories.component').then(m => m.CategoriesComponent),
      },
      {
        path: 'loan-applications',
        loadComponent: () =>
          import('./features/admin/loan-applications/loan-applications.component').then(m => m.LoanApplicationsComponent),
      },
      {
        path: 'active-loans',
        loadComponent: () =>
          import('./features/admin/active-loans/active-loans.component').then(m => m.ActiveLoansComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/admin/payments/payments.component').then(m => m.PaymentsComponent),
      },
      {
        path: 'financing-plans',
        loadComponent: () =>
          import('./features/admin/financing-plans/financing-plans.component').then(m => m.FinancingPlansComponent),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/admin/dashboard' },
];
