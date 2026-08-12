import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuditLog } from '../../../core/models';

@Component({
  selector: 'app-audit-logs',
  imports: [DatePipe, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  filtered = signal<AuditLog[]>([]);
  loading = signal(true);
  search = '';
  entityFilter = '';

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.get<AuditLog[]>('audit-logs').subscribe({
      next: (data) => { const list = Array.isArray(data) ? data : []; this.logs.set(list); this.filtered.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filter(): void {
    let result = this.logs();
    const q = this.search.toLowerCase();
    if (q) {
      result = result.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        (l.performedBy ?? '').toLowerCase().includes(q) ||
        String(l.entityId).includes(q)
      );
    }
    if (this.entityFilter) result = result.filter(l => l.entityType === this.entityFilter);
    this.filtered.set(result);
  }

  detailsText(details: Record<string, any> | undefined): string {
    if (!details) return '—';
    try {
      return JSON.stringify(details);
    } catch {
      return '—';
    }
  }

  actionBadge = (action: string) => {
    if (/create|insert/i.test(action)) return 'badge badge-success';
    if (/update|patch/i.test(action)) return 'badge badge-warning';
    if (/delete|remove/i.test(action)) return 'badge badge-danger';
    if (/login|auth/i.test(action)) return 'badge badge-info';
    return 'badge badge-muted';
  };
}
