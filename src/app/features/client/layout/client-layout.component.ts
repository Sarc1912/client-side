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
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css'],
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
