import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroSquares2x2,
  heroUsers,
  heroTag,
  heroShoppingBag,
  heroDocumentText,
  heroCurrencyDollar,
  heroCreditCard,
  heroBanknotes,
  heroChartBar,
  heroShieldCheck
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIconComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  providers: [
    provideIcons({
      heroSquares2x2,
      heroUsers,
      heroTag,
      heroShoppingBag,
      heroDocumentText,
      heroCurrencyDollar,
      heroCreditCard,
      heroBanknotes,
      heroChartBar,
      heroShieldCheck
    })
  ]
})
export class AdminLayoutComponent {
  navItems: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'heroSquares2x2' },
    { path: '/admin/users', label: 'Usuarios', icon: 'heroUsers' },
    { path: '/admin/categories', label: 'Categorías', icon: 'heroTag' },
    { path: '/admin/products', label: 'Productos', icon: 'heroShoppingBag' },
    { path: '/admin/loan-applications', label: 'Solicitudes', icon: 'heroDocumentText' },
    { path: '/admin/active-loans', label: 'Préstamos', icon: 'heroCurrencyDollar' },
    { path: '/admin/payments', label: 'Pagos', icon: 'heroCreditCard' },
    { path: '/admin/payment-methods', label: 'Métodos de pago', icon: 'heroBanknotes' },
    { path: '/admin/financing-plans', label: 'Planes', icon: 'heroChartBar' },
    { path: '/admin/audit-logs', label: 'Auditoría', icon: 'heroShieldCheck' },
  ];

  constructor(public auth: AuthService) { }

  userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? 'Admin';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  });

  pageTitle = computed(() => 'Panel de Administración');

  currentTime = computed(() => {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  });
}