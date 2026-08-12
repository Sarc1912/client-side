import { Component, OnInit, input, output, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import {
  ActiveLoan,
  LoanScheduleItem,
  PaymentData,
  PaymentMethod,
  loanProductsLabel,
} from '../../../core/models';

@Component({
  selector: 'app-client-payment-modal',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Reportar pago</h3>
          <button class="close-btn" (click)="close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          @if (loading()) {
            <div class="pay-loading">Cargando datos del pago...</div>
          } @else if (error()) {
            <div class="error-alert">{{ error() }}</div>
          } @else {
            <form (ngSubmit)="submit()" #payForm="ngForm">
              <!-- Loan summary -->
              <div class="loan-summary">
                <div>
                  <span class="ls-label">{{ loanProductsLabel(loan(), 'Préstamo #' + loan()?.id) }}</span>
                  <span class="ls-sub">{{ loan()?.application?.financingPlan?.title ?? 'Plan de financiamiento' }}</span>
                </div>
                <div class="ls-balance">
                  <span class="ls-label">Saldo pendiente</span>
                  <span class="ls-value">{{ loan()?.remainingBalance | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              </div>

              <!-- Installments -->
              <div class="form-group">
                <label class="form-label">Cuota a pagar</label>
                <select name="scheduleItemId" [(ngModel)]="formData.scheduleItemId" (ngModelChange)="onItemChange()" class="form-input" required>
                  <option [ngValue]="null" disabled>Selecciona una cuota</option>
                  @for (item of pendingInstallments(); track item.id) {
                    <option [ngValue]="item.id">
                      {{ item.installmentNumber === 0 ? 'Enganche' : 'Cuota #' + item.installmentNumber }} — Saldo {{ item.amountDue - item.amountPaid | currency:'USD':'symbol':'1.2-2' }}
                    </option>
                  }
                </select>
              </div>

              <!-- Amount -->
              <div class="form-group">
                <label class="form-label">Monto</label>
                <input type="number" name="amountPaid" [(ngModel)]="formData.amountPaid" class="form-input" required min="0.01" step="0.01"/>
              </div>

              <!-- Methods -->
              <div class="form-group">
                <label class="form-label">Método de pago</label>
                <div class="method-grid">
                  @for (m of methods(); track m.code) {
                    <button
                      type="button"
                      class="method-option"
                      [class.selected]="formData.paymentMethod === m.code"
                      (click)="selectMethod(m)"
                    >
                      <span class="method-icon">{{ m.icon ?? '💳' }}</span>
                      <span class="method-name">{{ m.name }}</span>
                      @if (m.description) {
                        <span class="method-desc">{{ m.description }}</span>
                      }
                    </button>
                  }
                </div>
              </div>

              <!-- Reference -->
              @if (selectedMethod()?.requiresReference) {
                <div class="form-group">
                  <label class="form-label">Referencia de la transacción</label>
                  <input type="text" name="transactionReference" [(ngModel)]="formData.transactionReference" class="form-input" placeholder="Nº de transacción o referencia" required/>
                </div>
              }

              @if (submitError()) {
                <div class="error-alert" style="margin-bottom:1rem;">{{ submitError() }}</div>
              }

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="close()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="!payForm.valid || isSubmitting()">
                  {{ isSubmitting() ? 'Registrando...' : 'Registrar pago' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pay-loading { padding: 2rem; text-align: center; color: var(--text-muted); }
    .error-alert {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
    .loan-summary {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem;
      background: var(--accent-light); border: 1px solid var(--accent);
      border-radius: 10px;
    }
    .ls-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .ls-sub { display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem; }
    .ls-balance { text-align: right; }
    .ls-value { display: block; font-size: 1.15rem; font-weight: 700; color: var(--accent-hover); }
    .method-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.6rem;
    }
    .method-option {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.15rem;
      background: var(--bg-base); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.75rem; cursor: pointer;
      text-align: left; transition: border-color 0.15s, background 0.15s;
    }
    .method-option:hover { border-color: var(--accent); }
    .method-option.selected {
      border-color: var(--accent); background: var(--accent-light);
    }
    .method-icon { font-size: 1.15rem; }
    .method-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .method-desc { font-size: 0.7rem; color: var(--text-muted); }
  `],
})
export class ClientPaymentModalComponent implements OnInit {
  loan = input.required<ActiveLoan>();
  closed = output<void>();
  paid = output<void>();

  loading = signal(true);
  error = signal('');
  submitError = signal('');
  isSubmitting = signal(false);

  pendingInstallments = signal<LoanScheduleItem[]>([]);
  methods = signal<PaymentMethod[]>([]);

  formData = {
    scheduleItemId: null as number | null,
    amountPaid: 0,
    paymentMethod: '',
    transactionReference: '',
  };

  constructor(private api: ApiService) {}

  loanProductsLabel = loanProductsLabel;

  ngOnInit(): void {
    this.api.get<PaymentData>(`payment-data/${this.loan().id}`).subscribe({
      next: (data) => {
        this.pendingInstallments.set(data.pendingInstallments ?? []);
        this.methods.set(data.paymentMethods ?? []);
        if ((data.paymentMethods ?? []).length > 0) {
          this.formData.paymentMethod = data.paymentMethods[0].code;
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar los datos del pago');
      },
    });
  }

  selectedMethod = computed<PaymentMethod | undefined>(() =>
    this.methods().find((m) => m.code === this.formData.paymentMethod),
  );

  selectMethod(m: PaymentMethod): void {
    this.formData.paymentMethod = m.code;
    if (!m.requiresReference) {
      this.formData.transactionReference = '';
    }
  }

  onItemChange(): void {
    const item = this.pendingInstallments().find((i) => i.id === this.formData.scheduleItemId);
    if (item) {
      this.formData.amountPaid = Number((item.amountDue - item.amountPaid).toFixed(2));
    }
  }

  submit(): void {
    if (!this.formData.scheduleItemId || !this.formData.amountPaid || this.formData.amountPaid <= 0) return;
    this.isSubmitting.set(true);
    this.submitError.set('');

    const payload = {
      loanId: this.loan().id,
      scheduleItemId: this.formData.scheduleItemId,
      amountPaid: this.formData.amountPaid,
      paymentMethod: this.formData.paymentMethod,
      transactionReference: this.formData.transactionReference || undefined,
    };

    this.api.post('payment-records', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.paid.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submitError.set(err?.error?.message ?? 'No se pudo registrar el pago');
      },
    });
  }

  close(): void {
    this.closed.emit();
  }
}
