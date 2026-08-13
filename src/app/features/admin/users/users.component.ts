import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models';
import { DatePipe } from '@angular/common';
import { UserDetailModalComponent } from './user-detail-modal.component';
import { UserEditModalComponent } from './user-edit-modal.component';

@Component({
  selector: 'app-users',
  imports: [FormsModule, DatePipe, UserDetailModalComponent, UserEditModalComponent],
  templateUrl: 'user.component.html',
  styleUrls: ['./user.component.css']
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  filtered = signal<User[]>([]);
  loading = signal(true);
  searchQuery = '';
  statusFilter = '';
  page = signal(1);
  perPage = 8;
  detailUser = signal<User | null>(null);
  editUser = signal<User | null>(null);

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.get<User[]>('users').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.users.set(list);
        this.filtered.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase();
    let result = this.users().filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.nationalId?.toLowerCase().includes(q)
    );
    if (this.statusFilter) result = result.filter(u => u.status === this.statusFilter);
    this.filtered.set(result);
    this.page.set(1);
  }

  paginated = () => {
    const start = (this.page() - 1) * this.perPage;
    return this.filtered().slice(start, start + this.perPage);
  };
  totalPages = () => Math.max(1, Math.ceil(this.filtered().length / this.perPage));
  pageRange = () => Array.from({ length: this.totalPages() }, (_, i) => i + 1);

  toggleStatus(user: User): void {
    const next = user.status === 'active' ? 'blocked' : 'active';
    this.api.patch(`users/${user.id}`, { status: next }).subscribe(() => {
      const updated = this.users().map(u => u.id === user.id ? { ...u, status: next as any } : u);
      this.users.set(updated);
      this.onSearch();
    });
  }

  openDetail(user: User): void {
    this.detailUser.set(user);
  }

  closeDetail(): void {
    this.detailUser.set(null);
  }

  openEdit(user: User): void {
    this.editUser.set(user);
  }

  closeEdit(): void {
    this.editUser.set(null);
  }

  onSaved(updated: User): void {
    this.users.set(this.users().map(u => u.id === updated.id ? updated : u));
    this.onSearch();
  }

  statusBadge(s: string): string {
    return { active: 'badge-success', suspended: 'badge-warning', blocked: 'badge-danger' }[s] ?? 'badge-muted';
  }
  scoreBadge(score: number): string {
    if (score >= 700) return 'badge badge-success';
    if (score >= 600) return 'badge badge-warning';
    return 'badge badge-danger';
  }
}
