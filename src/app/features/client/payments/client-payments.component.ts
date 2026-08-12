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
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis pagos</h1>
        <p class="page-subtitle">Historial de pagos y reporte de nuevas cuotas</p>
      </div>
      <div class="header-actions">
        <select [(ngModel)]="selectedLoanId" class="form-input" style="width:auto;">
          <option [ngValue]="null" disabled>Selecciona un préstamo</option>
          @for (loan of payableLoans(); track loan.id) {
            <option [ngValue]="loan.id">#{{ loan.id }} — {{ loanProductsLabel(loan, 'Préstamo #' + loan.id) }}</option>
          }
        </select>
        <button class="btn-primary" (click)="openPayment()" [disabled]="!selectedLoanId || !selectedLoan()">
          <ng-icon name="heroBanknotes" size="16"></ng-icon>
          Reportar pago
        </button>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      @if (loading()) {
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Cargando pagos...</div>
      } @else if (myPayments().length === 0) {
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
          <ng-icon name="heroWallet" size="30" style="margin-bottom:0.5rem;"></ng-icon>
          <p style="margin:0;">Aún no has realizado pagos</p>
        </div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>#Ref</th>
              <th>Fecha</th>
              <th>Préstamo</th>
              <th>Cuota</th>
              <th>Método</th>
              <th>Estado</th>
              <th style="text-align:right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            @for (p of myPayments(); track p.id) {
              <tr>
                <td style="font-family:monospace;font-size:0.8rem;">{{ p.transactionReference ?? ('#' + p.id) }}</td>
                <td>{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td style="font-size:0.85rem;">#{{ p.loanId }}</td>
                <td style="font-size:0.85rem;">
                  @if (p.scheduleItem) {
                    {{ p.scheduleItem.installmentNumber === 0 ? 'Enganche' : 'Cuota #' + p.scheduleItem.installmentNumber }}
                  } @else { — }
                </td>
                <td>
                  <span class="badge badge-accent">{{ methodLabel(p.paymentMethod) }}</span>
                </td>
                <td><span class="badge" [class]="paymentStatusBadge(p.paymentStatus)">{{ paymentStatusLabel(p.paymentStatus) }}</span></td>
                <td style="text-align:right;color:var(--success);font-weight:600;">{{ p.amountPaid | currency:'USD':'symbol':'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (showPaymentModal() && selectedLoan()) {
      <app-client-payment-modal
        [loan]="selectedLoan()!"
        (closed)="showPaymentModal.set(false)"
        (paid)="onPaid()"
      ></app-client-payment-modal>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }
  `],
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
