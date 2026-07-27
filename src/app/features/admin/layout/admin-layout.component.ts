import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            @if (!collapsed()) {
              <span class="logo-text">LoanMS</span>
            }
          </div>
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())" [title]="collapsed() ? 'Expandir' : 'Colapsar'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [style.transform]="collapsed() ? 'rotate(180deg)' : ''">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="nav-active"
               class="nav-item" [title]="item.label">
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              @if (!collapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" [class.centered]="collapsed()">
            <div class="user-avatar">{{ userInitials() }}</div>
            @if (!collapsed()) {
              <div class="user-details">
                <span class="user-name">{{ auth.currentUser()?.fullName ?? 'Admin' }}</span>
                <span class="user-role">Administrador</span>
              </div>
            }
          </div>
          <button class="logout-btn" (click)="auth.logout()" [title]="'Cerrar sesión'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-wrapper">
        <header class="topbar">
          <div class="topbar-left">
            <h2 class="page-heading">{{ pageTitle() }}</h2>
          </div>
          <div class="topbar-right">
            <div class="topbar-time">{{ currentTime() }}</div>
            <div class="notification-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet/>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 240px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 68px; }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .logo { display: flex; align-items: center; gap: 0.65rem; overflow: hidden; }
    .logo-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-text { font-size: 1rem; font-weight: 700; white-space: nowrap; }
    .collapse-btn {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted);
      padding: 0.25rem;
      border-radius: 6px;
      display: flex; align-items: center;
      transition: color 0.2s, background 0.2s;
      flex-shrink: 0;
    }
    .collapse-btn:hover { color: var(--text-primary); background: var(--bg-hover); }

    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.18s;
      white-space: nowrap;
      overflow: hidden;
    }
    .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .nav-item.nav-active { background: var(--accent-light); color: var(--accent-hover); }
    .nav-icon { display: flex; flex-shrink: 0; }
    .nav-icon svg { width: 18px; height: 18px; }

    .sidebar-footer {
      border-top: 1px solid var(--border);
      padding: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .user-info { display: flex; align-items: center; gap: 0.65rem; overflow: hidden; }
    .user-info.centered { justify-content: center; width: 100%; }
    .user-avatar {
      width: 32px; height: 32px; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white;
    }
    .user-details { display: flex; flex-direction: column; overflow: hidden; }
    .user-name { font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.7rem; color: var(--text-muted); }
    .logout-btn {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted);
      padding: 0.4rem;
      border-radius: 6px;
      display: flex; align-items: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .logout-btn:hover { color: var(--danger); background: rgba(239,68,68,0.1); }

    /* Topbar */
    .main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar {
      height: 60px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      flex-shrink: 0;
    }
    .page-heading { font-size: 1rem; font-weight: 600; margin: 0; color: var(--text-primary); }
    .topbar-right { display: flex; align-items: center; gap: 1rem; }
    .topbar-time { font-size: 0.8rem; color: var(--text-muted); }
    .notification-btn {
      width: 36px; height: 36px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .notification-btn:hover { color: var(--text-primary); border-color: var(--accent); }

    /* Content */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 1.75rem;
      background: var(--bg-base);
    }
  `]
})
export class AdminLayoutComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/></svg>' },
    { path: '/admin/users', label: 'Usuarios', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' },
    { path: '/admin/categories', label: 'Categorías', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 7h10M7 12h10M7 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/></svg>' },
    { path: '/admin/products', label: 'Productos', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/><path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' },
    { path: '/admin/loan-applications', label: 'Solicitudes', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/><polyline points="10 9 9 9 8 9" stroke="currentColor" stroke-width="2"/></svg>' },
    { path: '/admin/active-loans', label: 'Préstamos', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' },
    { path: '/admin/payments', label: 'Pagos', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/></svg>' },
    { path: '/admin/financing-plans', label: 'Planes', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { path: '/admin/audit-logs', label: 'Auditoría', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  ];

  constructor(public auth: AuthService) {}

  userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? 'Admin';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  });

  pageTitle = computed(() => 'Panel de Administración');

  currentTime = computed(() => {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  });
}
