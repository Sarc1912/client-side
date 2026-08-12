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
  templateUrl: './client-payment-modal.component.html',
  styleUrls: ['./client-payment-modal.component.css'],
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
