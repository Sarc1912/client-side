import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PaymentRecord } from '../../../core/models';

@Component({
  selector: 'app-payments',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-subtitle">Historial de todos los pagos recibidos</p>
      </div>
    </div>

    <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
      <div style="display:flex;gap:0.75rem;align-items:center;">
        <input [(ngModel)]="dateFrom" type="date" class="form-input" style="width:auto;" (change)="filter()"/>
        <span style="color:var(--text-muted);font-size:0.85rem;">→</span>
        <input [(ngModel)]="dateTo" type="date" class="form-input" style="width:auto;" (change)="filter()"/>
        <select [(ngModel)]="methodFilter" (ngModelChange)="filter()" class="form-input" style="width:auto;">
          <option value="">Todos los métodos</option>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
        </select>
        <div class="total-pill">
          Total: <strong>{{ totalAmount() | currency:'USD':'symbol':'1.0-0' }}</strong>
        </div>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      @if (loading()) {
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Cargando pagos...</div>
      } @else if (filtered().length === 0) {
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">No se encontraron pagos</div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>#Ref</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td style="font-family:monospace;font-size:0.8rem;">{{ p.referenceNumber ?? 'N/A' }}</td>
                <td>{{ p.paymentDate | date:'dd/MM/yyyy HH:mm' }}</td>
                <td style="color:var(--success);font-weight:600;">{{ p.amount | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                  <span class="badge badge-accent">{{ methodLabel(p.paymentMethod) }}</span>
                </td>
                <td style="color:var(--text-muted);font-size:0.8rem;">{{ p.notes ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .total-pill {
      margin-left: auto;
      background: var(--accent-light);
      border: 1px solid var(--accent);
      border-radius: 8px;
      padding: 0.4rem 0.875rem;
      font-size: 0.85rem;
      color: var(--accent-hover);
    }
    .total-pill strong { font-weight: 700; }
  `]
})
export class PaymentsComponent implements OnInit {
  payments = signal<PaymentRecord[]>([]);
  filtered = signal<PaymentRecord[]>([]);
  loading = signal(true);
  dateFrom = '';
  dateTo = '';
  methodFilter = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<PaymentRecord[]>('payment-records').subscribe({
      next: (data) => { const list = Array.isArray(data) ? data : []; this.payments.set(list); this.filtered.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filter(): void {
    let result = this.payments();
    if (this.dateFrom) result = result.filter(p => new Date(p.paymentDate) >= new Date(this.dateFrom));
    if (this.dateTo) result = result.filter(p => new Date(p.paymentDate) <= new Date(this.dateTo));
    if (this.methodFilter) result = result.filter(p => p.paymentMethod === this.methodFilter);
    this.filtered.set(result);
  }

  totalAmount = () => this.filtered().reduce((acc, p) => acc + Number(p.amount), 0);
  methodLabel = (m: string) => ({ cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }[m] ?? m);
}
