import { Component, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PaymentRecord, ActiveLoan, LoanScheduleItem, PaymentMethod } from '../../../core/models';

@Component({
  selector: 'app-payments',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
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
