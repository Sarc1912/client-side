import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBanknotes, heroWallet } from '@ng-icons/heroicons/outline';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClientPaymentModalComponent } from '../payment-modal/client-payment-modal.component';
import {
  ActiveLoan,
  PaymentMethod,
  PaymentRecord,
  loanProductsLabel,
} from '../../../core/models';

@Component({
  selector: 'app-client-payments',
  imports: [CurrencyPipe, DatePipe, FormsModule, NgIconComponent, ClientPaymentModalComponent],
  providers: [
    provideIcons({
      heroBanknotes,
      heroWallet,
    }),
  ],
  templateUrl: './client-payments.component.html',
  styleUrls: ['./client-payments.component.css'],
})
export class ClientPaymentsComponent implements OnInit {
  loading = signal(true);
  showPaymentModal = signal(false);
  selectedLoanId = signal<number | null>(null);

  loans = signal<ActiveLoan[]>([]);
  payments = signal<PaymentRecord[]>([]);
  methods = signal<PaymentMethod[]>([]);

  constructor(private api: ApiService, private auth: AuthService) {}

  loanProductsLabel = loanProductsLabel;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.api.get<ActiveLoan[]>('active-loans').subscribe({
      next: (data) => {
        const myLoans = (Array.isArray(data) ? data : []).filter((l) => l.userId === userId);
        this.loans.set(myLoans);
        if (!this.selectedLoanId()) {
          const first = myLoans.find((l) => l.loanStatus === 'active') ?? myLoans[0];
          if (first) this.selectedLoanId.set(first.id);
        }
      },
      error: () => {},
    });

    this.api.get<PaymentRecord[]>('payment-records').subscribe({
      next: (data) => {
        this.payments.set(
          (Array.isArray(data) ? data : []).filter((p) => p.loan?.userId === userId)
        );
      },
      error: () => {},
      complete: () => this.loading.set(false),
    });

    this.api.get<PaymentMethod[]>('payment-methods').subscribe({
      next: (data) => this.methods.set(Array.isArray(data) ? data : []),
      error: () => {},
    });
  }

  payableLoans = computed(() =>
    this.loans().filter((l) => l.loanStatus === 'active' || Number(l.remainingBalance) > 0)
  );

  selectedLoan = computed(() =>
    this.loans().find((l) => l.id === this.selectedLoanId()) ?? null
  );

  myPayments = computed(() => {
    return [...this.payments()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) * -1);
  });

  openPayment(): void {
    this.showPaymentModal.set(true);
  }

  onPaid(): void {
    this.showPaymentModal.set(false);
    this.loading.set(true);
    this.load();
  }

  methodLabel = (m: string) => this.methods().find((x) => x.code === m)?.name ?? m;
  paymentStatusLabel = (s: string) => ({ completed: 'Completado', refunded: 'Reembolsado', failed: 'Fallido' }[s] ?? s);
  paymentStatusBadge = (s: string) => ({ completed: 'badge-success', refunded: 'badge-muted', failed: 'badge-danger' }[s] ?? 'badge-muted');
}
