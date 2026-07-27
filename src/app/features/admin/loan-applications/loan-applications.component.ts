import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { LoanApplication } from '../../../core/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-loan-applications',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Solicitudes de Préstamo</h1>
        <p class="page-subtitle">Revisa y gestiona las solicitudes de financiamiento</p>
      </div>
    </div>

    <!-- Status tabs -->
    <div class="status-tabs">
      @for (tab of tabs; track tab.value) {
        <button class="status-tab" [class.active]="activeTab() === tab.value" (click)="setTab(tab.value)">
          {{ tab.label }}
          <span class="tab-count">{{ countByStatus(tab.value) }}</span>
        </button>
      }
    </div>

    <div class="card" style="padding: 0; overflow: hidden; margin-top: 1rem;">
      @if (loading()) {
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Cargando solicitudes...</div>
      } @else if (displayList().length === 0) {
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">No hay solicitudes en esta categoría</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (app of displayList(); track app.id) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:0.65rem;">
                    <div class="table-avatar">{{ app.user?.fullName?.[0] ?? 'U' }}</div>
                    <div>
                      <div>{{ app.user?.fullName ?? ('Usuario #' + app.userId) }}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted)">Score: {{ app.user?.creditScore ?? '—' }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ app.product?.title ?? ('Producto #' + app.productId) }}</td>
                <td>{{ app.requestedAmount | currency:'USD':'symbol':'1.0-0' }}</td>
                <td>
                  <div style="font-size:0.8rem;">{{ app.financingPlan?.name ?? ('Plan #' + app.financingPlanId) }}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted)">{{ app.financingPlan?.durationMonths ?? '?' }} meses</div>
                </td>
                <td><span class="badge" [class]="statusBadge(app.status)">{{ statusLabel(app.status) }}</span></td>
                <td>{{ app.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  @if (app.status === 'pending') {
                    <div style="display:flex;gap:0.35rem;">
                      <button class="btn-approve" (click)="updateStatus(app, 'approved')" title="Aprobar">✓ Aprobar</button>
                      <button class="btn-reject" (click)="updateStatus(app, 'rejected')" title="Rechazar">✗</button>
                    </div>
                  } @else {
                    <span style="font-size:0.8rem;color:var(--text-muted)">Sin acciones</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .status-tabs { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .status-tab {
      padding: 0.5rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.825rem;
      font-weight: 500;
      cursor: pointer;
      display: flex; align-items: center; gap: 0.5rem;
      transition: all 0.2s;
    }
    .status-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
    .status-tab.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent-hover); }
    .tab-count {
      background: var(--bg-surface);
      border-radius: 999px;
      padding: 0.1rem 0.45rem;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .table-avatar {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0;
    }
    .btn-approve {
      padding: 0.3rem 0.65rem;
      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.3);
      border-radius: 6px;
      color: #4ade80;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-approve:hover { background: rgba(34,197,94,0.25); }
    .btn-reject {
      width: 28px; height: 28px;
      padding: 0;
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 6px;
      color: #f87171;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-reject:hover { background: rgba(239,68,68,0.25); }
  `]
})
export class LoanApplicationsComponent implements OnInit {
  applications = signal<LoanApplication[]>([]);
  loading = signal(true);
  activeTab = signal('all');

  tabs = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Aprobadas', value: 'approved' },
    { label: 'Rechazadas', value: 'rejected' },
    { label: 'Canceladas', value: 'cancelled' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<LoanApplication[]>('loan-applications').subscribe({
      next: (data) => { this.applications.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(val: string) { this.activeTab.set(val); }
  displayList = () => this.activeTab() === 'all' ? this.applications() : this.applications().filter(a => a.status === this.activeTab());
  countByStatus = (s: string) => s === 'all' ? this.applications().length : this.applications().filter(a => a.status === s).length;

  updateStatus(app: LoanApplication, status: 'approved' | 'rejected'): void {
    this.api.patch(`loan-applications/${app.id}`, { status }).subscribe(() => {
      this.applications.update(list => list.map(a => a.id === app.id ? { ...a, status } : a));
    });
  }

  statusLabel = (s: string) => ({ pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' }[s] ?? s);
  statusBadge = (s: string) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-muted' }[s] ?? 'badge-muted');
}
