import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroSquares2x2,
  heroShoppingBag,
  heroCreditCard,
  heroArrowRightOnRectangle,
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIconComponent],
  providers: [
    provideIcons({
      heroSquares2x2,
      heroShoppingBag,
      heroCreditCard,
      heroArrowRightOnRectangle,
    }),
  ],
  template: `
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a routerLink="/client/dashboard" class="brand">
            <div class="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#818cf8"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <span class="brand-text">Finan<span class="brand-accent">Crece</span></span>
          </a>

          <nav class="nav">
            @for (item of navItems; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="nav-active" [routerLinkActiveOptions]="{ exact: true }"
                class="nav-item">
                <ng-icon [name]="item.icon" size="17"></ng-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <div class="topbar-right">
            <div class="user-chip">
              <div class="user-avatar">{{ userInitials() }}</div>
              <div class="user-meta">
                <span class="user-name">{{ auth.currentUser()?.fullName ?? 'Usuario' }}</span>
                <span class="user-role">Cliente</span>
              </div>
            </div>
            <button class="logout-btn" (click)="auth.logout()" title="Cerrar sesión">
              <ng-icon name="heroArrowRightOnRectangle" size="18"></ng-icon>
            </button>
          </div>
        </div>
      </header>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { min-height: 100vh; background: var(--bg-base); }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(15, 17, 23, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
    }

    .topbar-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .brand { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
    .brand-icon {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-text { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
    .brand-accent { color: var(--accent-hover); }

    .nav { display: flex; gap: 0.35rem; margin-left: 1rem; }
    .nav-item {
      display: inline-flex; align-items: center; gap: 0.45rem;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s;
    }
    .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .nav-active { background: var(--accent-light); color: var(--accent-hover); }

    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; }

    .user-chip { display: flex; align-items: center; gap: 0.6rem; }
    .user-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 0.8rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .user-meta { display: flex; flex-direction: column; line-height: 1.2; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .user-role { font-size: 0.7rem; color: var(--text-muted); }

    .logout-btn {
      width: 38px; height: 38px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text-muted);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .logout-btn:hover { color: var(--danger); border-color: var(--danger); }

    .content { max-width: 1280px; margin: 0 auto; padding: 1.75rem 1.5rem 3rem; }

    @media (max-width: 720px) {
      .nav { display: none; }
      .user-meta { display: none; }
      .topbar-inner { gap: 1rem; }
    }
  `],
})
export class ClientLayoutComponent {
  navItems: NavItem[] = [
    { path: '/client/dashboard', label: 'Mi panel', icon: 'heroSquares2x2' },
    { path: '/client/payments', label: 'Pagos', icon: 'heroCreditCard' },
    { path: '/shop', label: 'Tienda', icon: 'heroShoppingBag' },
  ];

  constructor(public auth: AuthService) {}

  userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? 'Cliente';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  currentTime = signal(new Date());
}
