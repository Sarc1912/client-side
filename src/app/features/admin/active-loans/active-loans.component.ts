import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ActiveLoan } from '../../../core/models';

@Component({
  selector: 'app-active-loans',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Préstamos Activos</h1>
        <p class="page-subtitle">Seguimiento de todos los préstamos en cartera</p>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      @if (loading()) {
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Cargando préstamos...</div>
      } @else if (loans().length === 0) {
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">No hay préstamos activos</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Capital</th>
              <th>Cuota mensual</th>
              <th>Saldo restante</th>
              <th>Fecha fin</th>
              <th>Estado</th>
              <th>Cronograma</th>
            </tr>
          </thead>
          <tbody>
            @for (loan of loans(); track loan.id) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:0.65rem;">
                    <div class="table-avatar">{{ loan.user?.fullName?.[0] ?? 'U' }}</div>
                    {{ loan.user?.fullName ?? ('Usuario #' + loan.userId) }}
                  </div>
                </td>
                <td>{{ loan.principalAmount | currency:'USD':'symbol':'1.0-0' }}</td>
                <td>{{ loan.monthlyPayment | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                  <div style="display:flex;flex-direction:column;gap:0.25rem;">
                    <span>{{ loan.remainingBalance | currency:'USD':'symbol':'1.0-0' }}</span>
                    <div class="progress-bar">
                      <div class="progress-fill"
                        [style.width.%]="progressPercent(loan)"
                        [style.background]="progressColor(loan)">
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ loan.endDate | date:'dd/MM/yyyy' }}</td>
                <td><span class="badge" [class]="loanStatusBadge(loan.status)">{{ loanStatusLabel(loan.status) }}</span></td>
                <td>
                  <button class="action-btn" (click)="toggleSchedule(loan.id)" title="Ver cronograma">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <!-- Schedule row -->
              @if (expandedLoanId() === loan.id && loan.scheduleItems) {
                <tr class="schedule-row">
                  <td colspan="7" style="padding: 0;">
                    <div class="schedule-panel">
                      <table style="border: none;">
                        <thead>
                          <tr>
                            <th style="border-bottom: 1px solid var(--border);">#</th>
                            <th style="border-bottom: 1px solid var(--border);">Vencimiento</th>
                            <th style="border-bottom: 1px solid var(--border);">Capital</th>
                            <th style="border-bottom: 1px solid var(--border);">Interés</th>
                            <th style="border-bottom: 1px solid var(--border);">Total</th>
                            <th style="border-bottom: 1px solid var(--border);">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (item of loan.scheduleItems; track item.id) {
                            <tr>
                              <td>{{ item.installmentNumber }}</td>
                              <td>{{ item.dueDate | date:'dd/MM/yy' }}</td>
                              <td>{{ item.principalAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                              <td>{{ item.interestAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                              <td>{{ item.totalAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                              <td><span class="badge" [class]="scheduleStatusBadge(item.status)">{{ item.status }}</span></td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .table-avatar {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0;
    }
    .progress-bar { height: 4px; background: var(--bg-surface); border-radius: 2px; width: 80px; }
    .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
    .action-btn {
      width: 28px; height: 28px;
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--text-secondary); transition: all 0.2s;
    }
    .action-btn:hover { background: var(--accent-light); color: var(--accent-hover); border-color: var(--accent); }
    .schedule-row td { background: var(--bg-surface); padding: 0 !important; }
    .schedule-panel { padding: 0.75rem 1rem; }
    .schedule-panel table { margin: 0; }
  `]
})
export class ActiveLoansComponent implements OnInit {
  loans = signal<ActiveLoan[]>([]);
  loading = signal(true);
  expandedLoanId = signal<number | null>(null);

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.get<ActiveLoan[]>('active-loans').subscribe({
      next: (data) => { this.loans.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleSchedule(id: number): void {
    this.expandedLoanId.set(this.expandedLoanId() === id ? null : id);
  }

  progressPercent(loan: ActiveLoan): number {
    if (!loan.totalAmount || loan.totalAmount === 0) return 0;
    const paid = loan.totalAmount - loan.remainingBalance;
    return Math.min(100, (paid / loan.totalAmount) * 100);
  }
  progressColor(loan: ActiveLoan): string {
    const p = this.progressPercent(loan);
    if (p >= 80) return '#22c55e';
    if (p >= 40) return '#6366f1';
    return '#f59e0b';
  }

  loanStatusLabel = (s: string) => ({ current: 'Al corriente', delinquent: 'En mora', paid_off: 'Pagado', defaulted: 'Incumplido' }[s] ?? s);
  loanStatusBadge = (s: string) => ({ current: 'badge-success', delinquent: 'badge-warning', paid_off: 'badge-info', defaulted: 'badge-danger' }[s] ?? 'badge-muted');
  scheduleStatusBadge = (s: string) => ({ pending: 'badge-muted', paid: 'badge-success', overdue: 'badge-danger', partial: 'badge-warning' }[s] ?? 'badge-muted');
}
