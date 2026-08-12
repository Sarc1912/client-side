import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroCurrencyDollar,
  heroCalendarDays,
  heroWallet,
  heroDocumentText,
  heroShoppingBag,
  heroArrowRight,
  heroCheckCircle,
  heroClock,
  heroExclamationTriangle,
  heroChevronRight,
  heroBanknotes,
} from '@ng-icons/heroicons/outline';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClientPaymentModalComponent } from '../payment-modal/client-payment-modal.component';
import {
  ActiveLoan,
  LoanApplication,
  LoanScheduleItem,
  PaymentMethod,
  PaymentRecord,
  loanProductsLabel,
} from '../../../core/models';

@Component({
  selector: 'app-client-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, NgIconComponent, ClientPaymentModalComponent],
  providers: [
    provideIcons({
      heroCurrencyDollar,
      heroCalendarDays,
      heroWallet,
      heroDocumentText,
      heroShoppingBag,
      heroArrowRight,
      heroCheckCircle,
      heroClock,
      heroExclamationTriangle,
      heroChevronRight,
      heroBanknotes,
    }),
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css'],
})
export class ClientDashboardComponent implements OnInit {
  loading = signal(true);
  showPaymentModal = signal(false);
  selectedLoanId = signal<number | null>(null);

  loans = signal<ActiveLoan[]>([]);
  applications = signal<LoanApplication[]>([]);
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
        this.loans.set((Array.isArray(data) ? data : []).filter((l) => l.userId === userId));
      },
      error: () => {},
    });

    this.api.get<LoanApplication[]>('loan-applications').subscribe({
      next: (data) => {
        this.applications.set(
          (Array.isArray(data) ? data : []).filter((a) => a.userId === userId)
        );
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

  openPayment(): void {
    this.showPaymentModal.set(true);
  }

  onPaid(): void {
    this.showPaymentModal.set(false);
    this.loading.set(true);
    this.load();
  }

  firstName = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ')[0] || 'Cliente';
  });

  activeLoan = computed<ActiveLoan | null>(() => {
    const loans = this.loans();
    if (loans.length === 0) return null;
    const id = this.selectedLoanId();
    if (id !== null) {
      const match = loans.find((l) => l.id === id);
      if (match) return match;
    }
    return loans.find((l) => l.loanStatus === 'active') ?? loans[0] ?? null;
  });

  sortedItems = computed<LoanScheduleItem[]>(() => {
    const items = this.activeLoan()?.scheduleItems ?? [];
    return [...items].sort((a, b) => a.installmentNumber - b.installmentNumber);
  });

  nextPayment = computed<LoanScheduleItem | null>(() => {
    return this.sortedItems().find((i) => i.status !== 'paid') ?? null;
  });

  upcomingItems = computed<LoanScheduleItem[]>(() => {
    return this.sortedItems()
      .filter((i) => i.status !== 'paid')
      .slice(0, 5);
  });

  myApplications = computed(() => {
    return this.applications().slice(0, 8);
  });

  myPayments = computed(() => {
    return [...this.payments()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) * -1);
  });

  totalRemaining = computed(() =>
    this.loans().reduce((acc, l) => acc + Number(l.remainingBalance ?? 0), 0)
  );

  paymentsCount = computed(() => this.payments().length);

  pendingAppsCount = computed(() =>
    this.applications().filter((a) => a.status === 'pending' || a.status === 'under_review').length
  );

  activeLoanProduct = computed(() => {
    const loan = this.activeLoan();
    return loanProductsLabel(loan, 'Préstamo activo');
  });

  isOverdue = (item: LoanScheduleItem) =>
    item.status === 'overdue' || (item.status !== 'paid' && new Date(item.dueDate) < new Date());

  nextPaymentStatus = computed(() => {
    const np = this.nextPayment();
    if (!np) return 'Al corriente';
    if (this.isOverdue(np)) return 'Vencido';
    if (np.status === 'partially_paid') return 'Abonado parcial';
    return 'Pendiente';
  });

  nextPaymentBadge = computed(() => {
    const np = this.nextPayment();
    if (!np) return 'badge-success';
    if (this.isOverdue(np)) return 'badge-danger';
    if (np.status === 'partially_paid') return 'badge-warning';
    return 'badge-warning';
  });

  loanStatusLabel = (s: string) =>
    ({ active: 'Activo', paid_in_full: 'Pagado', defaulted: 'Vencido', written_off: 'Castigado' }[s] ?? s);
  loanStatusBadge = (s: string) =>
    ({ active: 'badge-success', paid_in_full: 'badge-info', defaulted: 'badge-danger', written_off: 'badge-muted' }[s] ?? 'badge-muted');

  applicationLabel = (s: string) =>
    ({ pending: 'Pendiente', under_review: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' }[s] ?? s);
  applicationBadge = (s: string) =>
    ({ pending: 'badge-warning', under_review: 'badge-info', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-muted' }[s] ?? 'badge-muted');

  installmentLabel = (s: string) =>
    ({ unpaid: 'Pendiente', partially_paid: 'Parcial', paid: 'Pagado', overdue: 'Vencido' }[s] ?? s);
  installmentBadge = (s: string) =>
    ({ unpaid: 'badge-warning', partially_paid: 'badge-info', paid: 'badge-success', overdue: 'badge-danger' }[s] ?? 'badge-muted');

  methodLabel = (m: string) => this.methods().find((x) => x.code === m)?.name ?? m;
}
