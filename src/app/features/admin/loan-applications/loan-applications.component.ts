import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { LoanApplication, loanProductsLabel } from '../../../core/models';
import { DatePipe } from '@angular/common';
import { LoanCreateModalComponent } from './loan-create-modal.component';

@Component({
  selector: 'app-loan-applications',
  imports: [FormsModule, CurrencyPipe, DatePipe, LoanCreateModalComponent],
  templateUrl: './loan-applications.component.html',
  styleUrls: ['./loan-applications.component.css']
})
export class LoanApplicationsComponent implements OnInit {
  applications = signal<LoanApplication[]>([]);
  loading = signal(true);
  activeTab = signal('all');
  showCreateModal = signal(false);

  tabs = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'En revisión', value: 'under_review' },
    { label: 'Aprobadas', value: 'approved' },
    { label: 'Rechazadas', value: 'rejected' },
    { label: 'Canceladas', value: 'cancelled' },
  ];

  constructor(private api: ApiService) {}

  loanProductsLabel = loanProductsLabel;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<LoanApplication[]>('loan-applications').subscribe({
      next: (data) => { this.applications.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(val: string) { this.activeTab.set(val); }
  displayList = () => this.activeTab() === 'all' ? this.applications() : this.applications().filter(a => a.status === this.activeTab());
  countByStatus = (s: string) => s === 'all' ? this.applications().length : this.applications().filter(a => a.status === s).length;

  updateStatus(app: LoanApplication, status: 'approved' | 'rejected'): void {
    const action = status === 'approved' ? 'approve' : 'reject';
    const reason = status === 'rejected'
      ? (prompt('Motivo del rechazo (opcional):') ?? '')
      : undefined;

    this.api.post(`loan-applications/${app.id}/${action}`, reason ? { reason } : {}).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message ?? 'No se pudo procesar la solicitud'),
    });
  }

  statusLabel = (s: string) => ({ pending: 'Pendiente', under_review: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' }[s] ?? s);
  statusBadge = (s: string) => ({ pending: 'badge-warning', under_review: 'badge-info', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-muted' }[s] ?? 'badge-muted');
}
