import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuditLog } from '../../../core/models';

@Component({
  selector: 'app-audit-logs',
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Auditoría</h1>
        <p class="page-subtitle">Registro inmutable de todas las acciones del sistema</p>
      </div>
    </div>

    <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
      <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
        <input [(ngModel)]="search" (ngModelChange)="filter()" class="form-input search-input" placeholder="Buscar por acción o entidad..." style="flex:1;min-width:200px;"/>
        <select [(ngModel)]="entityFilter" (ngModelChange)="filter()" class="form-input" style="width:auto;">
          <option value="">Todas las entidades</option>
          <option value="User">Usuario</option>
          <option value="LoanApplication">Solicitud</option>
          <option value="ActiveLoan">Préstamo</option>
          <option value="PaymentRecord">Pago</option>
          <option value="Product">Producto</option>
        </select>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      @if (loading()) {
        <div style="padding: 2rem; text-align:center; color:var(--text-muted);">Cargando registros...</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Actor</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>ID</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            @for (log of filtered(); track log.id) {
              <tr>
                <td style="font-size:0.78rem;white-space:nowrap;">{{ log.createdAt | date:'dd/MM/yy HH:mm:ss' }}</td>
                <td style="font-size:0.85rem;">{{ log.performedBy }}</td>
                <td>
                  <span class="badge" [class]="actionBadge(log.action)">{{ log.action }}</span>
                </td>
                <td style="font-size:0.8rem;color:var(--text-secondary);">{{ log.entityType }}</td>
                <td style="font-family:monospace;font-size:0.78rem;">{{ log.entityId }}</td>
                <td style="font-family:monospace;font-size:0.75rem;color:var(--text-muted);">{{ detailsText(log.details) }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (filtered().length === 0) {
          <div style="padding: 3rem; text-align:center; color:var(--text-muted);">Sin registros</div>
        }
      }
    </div>
  `,
  styles: [`
    .search-input { padding-left: 0.875rem !important; }
  `]
})
export class AuditLogsComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  filtered = signal<AuditLog[]>([]);
  loading = signal(true);
  search = '';
  entityFilter = '';

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.get<AuditLog[]>('audit-logs').subscribe({
      next: (data) => { const list = Array.isArray(data) ? data : []; this.logs.set(list); this.filtered.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filter(): void {
    let result = this.logs();
    const q = this.search.toLowerCase();
    if (q) {
      result = result.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        (l.performedBy ?? '').toLowerCase().includes(q) ||
        String(l.entityId).includes(q)
      );
    }
    if (this.entityFilter) result = result.filter(l => l.entityType === this.entityFilter);
    this.filtered.set(result);
  }

  detailsText(details: Record<string, any> | undefined): string {
    if (!details) return '—';
    try {
      return JSON.stringify(details);
    } catch {
      return '—';
    }
  }

  actionBadge = (action: string) => {
    if (/create|insert/i.test(action)) return 'badge badge-success';
    if (/update|patch/i.test(action)) return 'badge badge-warning';
    if (/delete|remove/i.test(action)) return 'badge badge-danger';
    if (/login|auth/i.test(action)) return 'badge badge-info';
    return 'badge badge-muted';
  };
}
