import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ActiveLoan } from '../../../core/models';

@Component({
  selector: 'app-active-loans',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './active-loans.component.html',
  styleUrls: ['./active-loans.component.css']
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
    if (!loan.principalAmount || loan.principalAmount === 0) return 0;
    const paid = Math.max(0, loan.principalAmount - loan.remainingBalance);
    return Math.min(100, (paid / loan.principalAmount) * 100);
  }
  progressColor(loan: ActiveLoan): string {
    const p = this.progressPercent(loan);
    if (p >= 80) return '#22c55e';
    if (p >= 40) return '#6366f1';
    return '#f59e0b';
  }

  monthlyPayment(loan: ActiveLoan): number {
    const items = loan.scheduleItems ?? [];
    const installment = items.find(i => i.installmentNumber === 1);
    return installment ? installment.amountDue : 0;
  }

  loanStatusLabel = (s: string) => ({ active: 'Activo', paid_in_full: 'Pagado', defaulted: 'Incumplido', written_off: 'Castigado' }[s] ?? s);
  loanStatusBadge = (s: string) => ({ active: 'badge-success', paid_in_full: 'badge-info', defaulted: 'badge-danger', written_off: 'badge-muted' }[s] ?? 'badge-muted');
  scheduleStatusLabel = (s: string) => ({ unpaid: 'Pendiente', partially_paid: 'Parcial', paid: 'Pagada', overdue: 'Vencida' }[s] ?? s);
  scheduleStatusBadge = (s: string) => ({ unpaid: 'badge-muted', partially_paid: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger' }[s] ?? 'badge-muted');
}
