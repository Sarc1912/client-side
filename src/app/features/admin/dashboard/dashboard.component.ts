import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStats, LoanApplication } from '../../../core/models';
import { CurrencyPipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroUserGroup,
  heroCurrencyDollar,
  heroDocumentText,
  heroCreditCard,
  heroShoppingBag,
} from '@ng-icons/heroicons/outline';

import { ionAlertCircleOutline } from '@ng-icons/ionicons'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, NgIconComponent],
  viewProviders: [
    provideIcons({
      heroUserGroup,
      heroCurrencyDollar,
      heroDocumentText,
      heroCreditCard,
      heroShoppingBag,
      ionAlertCircleOutline
    })
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  recentApplications = signal<LoanApplication[]>([]);
  loadingApps = signal(true);
  loadingStats = signal(true); // Opcional: útil si quieres mostrar un skeleton loader en las tarjetas

  statCards = signal<any[]>([]);

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // 1. Obtener las últimas solicitudes
    this.loadingApps.set(true);
    this.api.get<LoanApplication[]>('loan-applications?limit=5').subscribe({
      next: (apps) => {
        this.recentApplications.set(Array.isArray(apps) ? apps.slice(0, 5) : []);
        this.loadingApps.set(false);
      },
      error: (err) => {
        console.error('Error al cargar solicitudes', err);
        this.loadingApps.set(false);
      },
    });

    // 2. Obtener las estadísticas reales desde el backend
    this.loadingStats.set(true);
    this.api.get<DashboardStats>('dashboard').subscribe({
      next: (realStats) => {
        this.stats.set(realStats);
        this.buildCards(realStats);
        this.loadingStats.set(false);
      },
      error: (err) => {
        console.error('Error al cargar estadísticas', err);
        this.loadingStats.set(false);
      }
    });
  }

  private buildCards(s: DashboardStats): void {
    this.statCards.set([
      { label: 'Usuarios registrados', value: s.totalUsers.toLocaleString(), color: '#6366f1', trendUp: s.userTrend.isUp, trend: s.userTrend.text, icon: 'heroUserGroup' },
      { label: 'Préstamos activos', value: s.activeLoans.toLocaleString(), color: '#22c55e', trendUp: s.activeLoanTrend.isUp, trend: s.activeLoanTrend.text, icon: 'heroCurrencyDollar' },
      { label: 'Solicitudes pendientes', value: s.pendingApplications.toLocaleString(), color: '#f59e0b', trendUp: s.applicationsTrend.isUp, trend: s.applicationsTrend.text, icon: 'heroDocumentText' },
      { label: 'Ingresos del mes', value: '$' + s.monthlyRevenue.toLocaleString(), color: '#38bdf8', trendUp: s.revenueTrend.isUp, trend: s.revenueTrend.text, icon: 'heroCreditCard' },
      { label: 'Total productos', value: s.totalProducts.toLocaleString(), color: '#a78bfa', trendUp: s.productTrend.isUp, trend: s.productTrend.text, icon: 'heroShoppingBag' },
      { label: 'Préstamos vencidos', value: s.overdueLoans.toLocaleString(), color: '#ef4444', trendUp: s.overdueTrend.isUp, trend: s.overdueTrend.text, icon: 'ionAlertCircleOutline' },
    ]);
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge badge-warning',
      approved: 'badge badge-success',
      rejected: 'badge badge-danger',
      cancelled: 'badge badge-muted',
    };
    return map[status] ?? 'badge badge-muted';
  }
}