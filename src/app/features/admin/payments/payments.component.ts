import { Component, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PaymentRecord, ActiveLoan, LoanScheduleItem, PaymentMethod } from '../../../core/models';

@Component({
  selector: 'app-payments',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-subtitle">Historial de todos los pagos recibidos</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/></svg>
        Registrar pago
      </button>
    </div>

    <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
      <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
        <input [(ngModel)]="dateFrom" type="date" class="form-input" style="width:auto;" (change)="filter()"/>
        <span style="color:var(--text-muted);font-size:0.85rem;">→</span>
        <input [(ngModel)]="dateTo" type="date" class="form-input" style="width:auto;" (change)="filter()"/>
        <select [(ngModel)]="methodFilter" (ngModelChange)="filter()" class="form-input" style="width:auto;">
          <option value="">Todos los métodos</option>
          @for (m of methods(); track m.code) {
            <option [value]="m.code">{{ m.name }}</option>
          }
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
              <th>Préstamo</th>
              <th>Cuota</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td style="font-family:monospace;font-size:0.8rem;">{{ p.transactionReference ?? 'N/A' }}</td>
                <td>{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td style="font-size:0.85rem;">
                  #{{ p.loanId }}
                  @if (p.loan?.user?.fullName) {
                    <span style="color:var(--text-muted)"> · {{ p.loan!.user!.fullName }}</span>
                  }
                </td>
                <td style="font-size:0.85rem;">
                  @if (p.scheduleItem) {
                    {{ p.scheduleItem.installmentNumber === 0 ? 'Enganche' : 'Cuota #' + p.scheduleItem.installmentNumber }}
                  } @else { — }
                </td>
                <td style="color:var(--success);font-weight:600;">{{ p.amountPaid | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                  <span class="badge badge-accent">{{ methodLabel(p.paymentMethod) }}</span>
                </td>
                <td><span class="badge" [class]="paymentStatusBadge(p.paymentStatus)">{{ paymentStatusLabel(p.paymentStatus) }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (isModalOpen()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Registrar pago</h3>
            <button class="close-btn" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <form (ngSubmit)="savePayment()" #payForm="ngForm" class="modal-body">
            @if (error()) {
              <div class="error-alert" style="margin-bottom:1rem;">{{ error() }}</div>
            }

            <div class="form-group">
              <label class="form-label">Préstamo</label>
              <select name="loanId" [(ngModel)]="formData.loanId" (ngModelChange)="onLoanChange()" class="form-input" required>
                <option [ngValue]="null" disabled>Selecciona un préstamo</option>
                @for (loan of loans(); track loan.id) {
                  <option [ngValue]="loan.id">#{{ loan.id }} — {{ loan.user?.fullName ?? ('Usuario ' + loan.userId) }}</option>
                }
              </select>
            </div>

            @if (formData.loanId) {
              <div class="form-group">
                <label class="form-label">Cuota</label>
                <select name="scheduleItemId" [(ngModel)]="formData.scheduleItemId" (ngModelChange)="onItemChange()" class="form-input" required>
                  <option [ngValue]="null" disabled>Selecciona una cuota</option>
                  @for (item of availableItems(); track item.id) {
                    <option [ngValue]="item.id">
                      {{ item.installmentNumber === 0 ? 'Enganche' : 'Cuota #' + item.installmentNumber }} — Saldo {{ item.amountDue - item.amountPaid | currency:'USD':'symbol':'1.2-2' }}
                    </option>
                  }
                </select>
              </div>
            }

            <div class="form-group">
              <label class="form-label">Monto</label>
              <input type="number" name="amountPaid" [(ngModel)]="formData.amountPaid" class="form-input" required min="0.01" step="0.01"/>
            </div>

            <div class="form-group">
              <label class="form-label">Método de pago</label>
              <select name="paymentMethod" [(ngModel)]="formData.paymentMethod" (ngModelChange)="onMethodChange()" class="form-input" required>
                @for (m of methods(); track m.code) {
                  <option [ngValue]="m.code">{{ m.icon ? m.icon + ' ' : '' }}{{ m.name }}</option>
                }
              </select>
              @if (selectedMethod()?.description) {
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">{{ selectedMethod()!.description }}</div>
              }
            </div>

            @if (selectedMethod()?.requiresReference) {
              <div class="form-group">
                <label class="form-label">Referencia</label>
                <input type="text" name="transactionReference" [(ngModel)]="formData.transactionReference" class="form-input" placeholder="Nº de transacción" required/>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!payForm.valid || isSubmitting()">
                {{ isSubmitting() ? 'Guardando...' : 'Registrar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
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
    .error-alert {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
  `]
})
export class PaymentsComponent implements OnInit {
  payments = signal<PaymentRecord[]>([]);
  filtered = signal<PaymentRecord[]>([]);
  loading = signal(true);
  loans = signal<ActiveLoan[]>([]);
  methods = signal<PaymentMethod[]>([]);
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  error = signal('');

  dateFrom = '';
  dateTo = '';
  methodFilter = '';

  formData = {
    loanId: null as number | null,
    scheduleItemId: null as number | null,
    amountPaid: 0,
    paymentMethod: 'cash',
    transactionReference: '',
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPayments();
    this.loadLoans();
    this.loadMethods();
  }

  loadPayments(): void {
    this.api.get<PaymentRecord[]>('payment-records').subscribe({
      next: (data) => { const list = Array.isArray(data) ? data : []; this.payments.set(list); this.filtered.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadLoans(): void {
    this.api.get<ActiveLoan[]>('active-loans').subscribe({
      next: (data) => this.loans.set(Array.isArray(data) ? data : []),
      error: () => this.loans.set([]),
    });
  }

  loadMethods(): void {
    this.api.get<PaymentMethod[]>('payment-methods').subscribe({
      next: (data) => this.methods.set(Array.isArray(data) ? data : []),
      error: () => this.methods.set([]),
    });
  }

  selectedMethod = computed<PaymentMethod | undefined>(() =>
    this.methods().find(m => m.code === this.formData.paymentMethod),
  );

  availableItems = computed<LoanScheduleItem[]>(() => {
    const loan = this.loans().find(l => l.id === this.formData.loanId);
    if (!loan?.scheduleItems) return [];
    return loan.scheduleItems
      .filter(i => i.status !== 'paid')
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  });

  openCreate(): void {
    this.formData = {
      loanId: null,
      scheduleItemId: null,
      amountPaid: 0,
      paymentMethod: 'cash',
      transactionReference: '',
    };
    this.error.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onLoanChange(): void {
    this.formData.scheduleItemId = null;
    this.formData.amountPaid = 0;
  }

  onItemChange(): void {
    const item = this.availableItems().find(i => i.id === this.formData.scheduleItemId);
    if (item) {
      this.formData.amountPaid = Number((item.amountDue - item.amountPaid).toFixed(2));
    }
  }

  onMethodChange(): void {
    if (!this.selectedMethod()?.requiresReference) {
      this.formData.transactionReference = '';
    }
  }

  savePayment(): void {
    if (!this.formData.loanId || !this.formData.amountPaid || this.formData.amountPaid <= 0) return;
    this.isSubmitting.set(true);
    this.error.set('');

    const payload = {
      loanId: this.formData.loanId,
      scheduleItemId: this.formData.scheduleItemId ?? undefined,
      amountPaid: this.formData.amountPaid,
      paymentMethod: this.formData.paymentMethod,
      transactionReference: this.formData.transactionReference || undefined,
    };

    this.api.post('payment-records', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.loadPayments();
        this.loadLoans();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo registrar el pago');
      },
    });
  }

  filter(): void {
    let result = this.payments();
    if (this.dateFrom) result = result.filter(p => new Date(p.createdAt) >= new Date(this.dateFrom));
    if (this.dateTo) result = result.filter(p => new Date(p.createdAt) <= new Date(this.dateTo));
    if (this.methodFilter) result = result.filter(p => p.paymentMethod === this.methodFilter);
    this.filtered.set(result);
  }

  totalAmount = () => this.filtered().reduce((acc, p) => acc + Number(p.amountPaid), 0);
  methodLabel = (m: string) => this.methods().find(x => x.code === m)?.name ?? m;
  paymentStatusLabel = (s: string) => ({ completed: 'Completado', refunded: 'Reembolsado', failed: 'Fallido' }[s] ?? s);
  paymentStatusBadge = (s: string) => ({ completed: 'badge-success', refunded: 'badge-muted', failed: 'badge-danger' }[s] ?? 'badge-muted');
}
