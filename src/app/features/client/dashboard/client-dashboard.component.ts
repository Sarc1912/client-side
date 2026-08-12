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
  template: `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Hola, {{ firstName() }} 👋</h1>
        <p class="page-subtitle">Este es el estado de tu financiamiento con nosotros</p>
      </div>
    </div>

    @if (loading()) {
      <div class="stats-grid">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="kpi-skeleton"></div>
        }
      </div>
      <div class="grid-2">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    } @else {
      <!-- KPI cards -->
      <div class="stats-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#6366f122;color:#818cf8;">
            <ng-icon name="heroCurrencyDollar" size="20"></ng-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ totalRemaining() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="kpi-label">Saldo restante</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#f59e0b22;color:#fbbf24;">
            <ng-icon name="heroCalendarDays" size="20"></ng-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ nextPayment()?.amountDue ?? 0 | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="kpi-label">Próximo pago</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#22c55e22;color:#4ade80;">
            <ng-icon name="heroWallet" size="20"></ng-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ paymentsCount() }}</span>
            <span class="kpi-label">Pagos realizados</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#38bdf822;color:#38bdf8;">
            <ng-icon name="heroDocumentText" size="20"></ng-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ pendingAppsCount() }}</span>
            <span class="kpi-label">Solicitudes en revisión</span>
          </div>
        </div>
      </div>

      <!-- Active loan -->
      @if (activeLoan()) {
        @if (loans().length > 1) {
          <div class="loan-tabs">
            @for (loan of loans(); track loan.id) {
              <button type="button" class="loan-tab" [class.active]="loan.id === activeLoan()?.id" (click)="selectedLoanId.set(loan.id)">
                {{ loanProductsLabel(loan, 'Préstamo #' + loan.id) }}
                <span class="loan-tab-bal">{{ loan.remainingBalance | currency:'USD':'symbol':'1.0-0' }}</span>
              </button>
            }
          </div>
        }
        <div class="loan-hero card">
          <div class="loan-hero-left">
            <div class="loan-thumb">
              <ng-icon name="heroShoppingBag" size="22"></ng-icon>
            </div>
            <div>
              <div class="loan-product">{{ activeLoanProduct() }}</div>
              <div class="loan-plan">
                <ng-icon name="heroDocumentText" size="13"></ng-icon>
                {{ activeLoan()?.application?.financingPlan?.title ?? 'Plan de financiamiento' }} ·
                {{ activeLoan()?.scheduleItems?.length ?? 0 }} cuotas
              </div>
            </div>
            <span class="badge" [class]="loanStatusBadge(activeLoan()!.loanStatus)">
              {{ loanStatusLabel(activeLoan()!.loanStatus) }}
            </span>
          </div>

          <div class="loan-hero-right">
            <div class="loan-stat">
              <span class="loan-stat-label">Capital financiado</span>
              <span class="loan-stat-value">{{ activeLoan()?.principalAmount | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="loan-stat">
              <span class="loan-stat-label">Saldo pendiente</span>
              <span class="loan-stat-value accent">{{ activeLoan()?.remainingBalance | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Next payment -->
          <div class="card section-card">
            <div class="section-header">
              <h3 class="section-title">Próximo pago</h3>
              <span class="badge" [class]="nextPaymentBadge()">{{ nextPaymentStatus() }}</span>
            </div>

            @if (nextPayment(); as np) {
              <div class="next-payment">
                <div class="np-amount">{{ np.amountDue - np.amountPaid | currency:'USD':'symbol':'1.2-2' }}</div>
                <div class="np-row">
                  <span class="np-label">Cuota #{{ np.installmentNumber === 0 ? 'Enganche' : np.installmentNumber }}</span>
                  <span class="np-due" [class.overdue]="isOverdue(np)">
                    <ng-icon [name]="isOverdue(np) ? 'heroExclamationTriangle' : 'heroClock'" size="14"></ng-icon>
                    {{ isOverdue(np) ? 'Vencida el ' + (np.dueDate | date:'dd/MM/yyyy') : 'Vence el ' + (np.dueDate | date:'dd/MM/yyyy') }}
                  </span>
                </div>
                @if (np.amountPaid > 0) {
                  <div class="np-partial">
                    Ya abonaste {{ np.amountPaid | currency:'USD':'symbol':'1.2-2' }} de esta cuota
                  </div>
                }
                <button class="btn-primary np-pay-btn" (click)="openPayment()">
                  <ng-icon name="heroBanknotes" size="16"></ng-icon>
                  Pagar ahora
                </button>
              </div>
            } @else {
              <div class="empty-inline">
                <ng-icon name="heroCheckCircle" size="26"></ng-icon>
                <p>¡No tienes cuotas pendientes!</p>
              </div>
            }

            <div class="schedule-preview">
              <div class="section-header" style="margin-bottom:0.6rem;">
                <h4 class="section-subtitle">Próximas cuotas</h4>
              </div>
              @for (item of upcomingItems(); track item.id) {
                <div class="schedule-row">
                  <span class="sc-num">{{ item.installmentNumber === 0 ? 'Enganche' : '#' + item.installmentNumber }}</span>
                  <span class="sc-date">{{ item.dueDate | date:'dd/MM/yy' }}</span>
                  <span class="sc-amount">{{ item.amountDue - item.amountPaid | currency:'USD':'symbol':'1.2-2' }}</span>
                  <span class="badge" [class]="installmentBadge(item.status)">{{ installmentLabel(item.status) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Recent payments -->
          <div class="card section-card">
            <div class="section-header">
              <h3 class="section-title">Pagos recientes</h3>
              @if (myPayments().length > 0) {
                <span class="badge badge-muted">{{ myPayments().length }} total</span>
              }
            </div>

            @if (myPayments().length === 0) {
              <div class="empty-inline">
                <ng-icon name="heroWallet" size="26"></ng-icon>
                <p>Aún no has realizado pagos</p>
              </div>
            } @else {
              <div class="pay-list">
                @for (p of myPayments().slice(0, 6); track p.id) {
                  <div class="pay-row">
                    <div class="pay-method">
                      <span class="pay-dot"></span>
                      <div>
                        <span class="pay-title">{{ methodLabel(p.paymentMethod) }}</span>
                        <span class="pay-sub">{{ p.createdAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                    </div>
                    <div class="pay-amount">+{{ p.amountPaid | currency:'USD':'symbol':'1.2-2' }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Purchases -->
        <div class="card section-card">
          <div class="section-header">
            <h3 class="section-title">Mis compras</h3>
            <a routerLink="/shop" class="link-all">
              Ir a la tienda <ng-icon name="heroArrowRight" size="14"></ng-icon>
            </a>
          </div>

          @if (myApplications().length === 0) {
            <div class="empty-state">
              <ng-icon name="heroShoppingBag" size="30"></ng-icon>
              <p>No tienes solicitudes de financiamiento todavía.</p>
              <a routerLink="/shop" class="btn-primary">
                Explorar productos
                <ng-icon name="heroArrowRight" size="15"></ng-icon>
              </a>
            </div>
          } @else {
            <div class="purchase-list">
              @for (app of myApplications(); track app.id) {
                <div class="purchase-row">
                  <div class="purchase-thumb">
                    <ng-icon name="heroShoppingBag" size="18"></ng-icon>
                  </div>
                  <div class="purchase-info">
                    <span class="purchase-title">{{ loanProductsLabel(app, 'Producto #' + (app.financingPlan?.productId ?? app.financingPlanId)) }}</span>
                    <span class="purchase-sub">{{ app.financingPlan?.title ?? 'Plan de financiamiento' }}</span>
                  </div>
                  <div class="purchase-amount">{{ app.totalLoanAmount | currency:'USD':'symbol':'1.0-0' }}</div>
                  <span class="badge" [class]="applicationBadge(app.status)">{{ applicationLabel(app.status) }}</span>
                  <ng-icon name="heroChevronRight" size="16" class="purchase-chevron"></ng-icon>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- No active loan -->
        <div class="card section-card">
          <div class="section-header">
            <h3 class="section-title">Mis compras</h3>
            <a routerLink="/shop" class="link-all">
              Ir a la tienda <ng-icon name="heroArrowRight" size="14"></ng-icon>
            </a>
          </div>

          @if (myApplications().length === 0) {
            <div class="empty-state">
              <ng-icon name="heroShoppingBag" size="30"></ng-icon>
              <p>No tienes solicitudes de financiamiento todavía.</p>
              <a routerLink="/shop" class="btn-primary">
                Explorar productos
                <ng-icon name="heroArrowRight" size="15"></ng-icon>
              </a>
            </div>
          } @else {
            <div class="purchase-list">
              @for (app of myApplications(); track app.id) {
                <div class="purchase-row">
                  <div class="purchase-thumb">
                    <ng-icon name="heroShoppingBag" size="18"></ng-icon>
                  </div>
                  <div class="purchase-info">
                    <span class="purchase-title">{{ loanProductsLabel(app, 'Producto #' + (app.financingPlan?.productId ?? app.financingPlanId)) }}</span>
                    <span class="purchase-sub">{{ app.financingPlan?.title ?? 'Plan de financiamiento' }}</span>
                  </div>
                  <div class="purchase-amount">{{ app.totalLoanAmount | currency:'USD':'symbol':'1.0-0' }}</div>
                  <span class="badge" [class]="applicationBadge(app.status)">{{ applicationLabel(app.status) }}</span>
                  <ng-icon name="heroChevronRight" size="16" class="purchase-chevron"></ng-icon>
                </div>
              }
            </div>
          }
        </div>
      }
    }

    @if (showPaymentModal() && activeLoan()) {
      <app-client-payment-modal
        [loan]="activeLoan()!"
        (closed)="showPaymentModal.set(false)"
        (paid)="onPaid()"
      ></app-client-payment-modal>
    }
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.1rem 1.25rem;
      display: flex; align-items: center; gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .kpi-card:hover { transform: translateY(-2px); border-color: var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
    .kpi-icon {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
    .kpi-label { font-size: 0.72rem; color: var(--text-muted); }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
    @media (max-width: 960px) { .grid-2 { grid-template-columns: 1fr; } }

    .section-card { padding: 1.25rem 1.5rem; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .section-title { font-size: 1rem; font-weight: 600; margin: 0; }
    .section-subtitle { font-size: 0.85rem; font-weight: 600; margin: 0; color: var(--text-secondary); }
    .link-all {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.8rem; color: var(--accent-hover);
      text-decoration: none; font-weight: 600;
    }
    .link-all:hover { text-decoration: underline; }

    /* Loan hero */
    .loan-hero { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .loan-tabs { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 1.25rem; }
    .loan-tab {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.55rem 0.9rem;
      cursor: pointer; font-size: 0.82rem; font-weight: 600; color: var(--text-primary);
      transition: border-color 0.15s, background 0.15s;
    }
    .loan-tab:hover { border-color: var(--accent); }
    .loan-tab.active { border-color: var(--accent); background: var(--accent-light); }
    .loan-tab-bal { font-size: 0.72rem; font-weight: 700; color: var(--accent-hover); }
    .loan-hero-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .loan-thumb {
      width: 52px; height: 52px; border-radius: 14px;
      background: var(--accent-light); color: var(--accent-hover);
      display: flex; align-items: center; justify-content: center;
    }
    .loan-product { font-size: 1.05rem; font-weight: 700; }
    .loan-plan { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
    .loan-hero-right { display: flex; gap: 2rem; }
    .loan-stat { display: flex; flex-direction: column; }
    .loan-stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .loan-stat-value { font-size: 1.2rem; font-weight: 700; }
    .loan-stat-value.accent { color: var(--accent-hover); }

    /* Next payment */
    .next-payment { padding: 1rem 0; border-bottom: 1px solid var(--border); }
    .np-amount { font-size: 2rem; font-weight: 800; color: var(--text-primary); }
    .np-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.4rem; }
    .np-label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; }
    .np-due { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; color: var(--text-muted); }
    .np-due.overdue { color: var(--danger); }
    .np-partial { margin-top: 0.5rem; font-size: 0.78rem; color: var(--warning); }
    .np-pay-btn { margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.4rem; }

    .empty-inline {
      padding: 2rem; text-align: center; color: var(--text-muted);
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    }
    .empty-inline p { margin: 0; font-size: 0.875rem; }

    /* Schedule preview */
    .schedule-preview { margin-top: 1rem; }
    .schedule-row {
      display: grid; grid-template-columns: 64px 1fr auto auto; gap: 0.75rem; align-items: center;
      padding: 0.55rem 0; border-bottom: 1px solid var(--border);
    }
    .schedule-row:last-child { border-bottom: none; }
    .sc-num { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
    .sc-date { font-size: 0.8rem; color: var(--text-muted); }
    .sc-amount { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); text-align: right; }

    /* Payments */
    .pay-list { display: flex; flex-direction: column; }
    .pay-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.65rem 0; border-bottom: 1px solid var(--border);
    }
    .pay-row:last-child { border-bottom: none; }
    .pay-method { display: flex; align-items: center; gap: 0.7rem; }
    .pay-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
    .pay-title { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .pay-sub { display: block; font-size: 0.72rem; color: var(--text-muted); }
    .pay-amount { font-size: 0.9rem; font-weight: 700; color: var(--success); }

    /* Purchases */
    .purchase-list { display: flex; flex-direction: column; }
    .purchase-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.8rem 0.5rem; border-bottom: 1px solid var(--border);
      transition: background 0.15s; border-radius: 8px;
    }
    .purchase-row:last-child { border-bottom: none; }
    .purchase-row:hover { background: var(--bg-hover); }
    .purchase-thumb {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: var(--bg-surface); color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
    }
    .purchase-info { flex: 1; display: flex; flex-direction: column; }
    .purchase-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .purchase-sub { font-size: 0.75rem; color: var(--text-muted); }
    .purchase-amount { font-size: 0.9rem; font-weight: 700; }
    .purchase-chevron { color: var(--text-muted); }

    .empty-state {
      padding: 3rem 1rem; text-align: center; color: var(--text-muted);
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
    }
    .empty-state p { margin: 0; font-size: 0.9rem; }

    /* Skeletons */
    .kpi-skeleton { height: 74px; border-radius: 14px; background: linear-gradient(90deg, var(--bg-card) 25%, var(--border) 50%, var(--bg-card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .skeleton-card { height: 260px; border-radius: 14px; background: linear-gradient(90deg, var(--bg-card) 25%, var(--border) 50%, var(--bg-card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `],
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
