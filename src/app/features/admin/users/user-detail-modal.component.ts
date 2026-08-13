import { Component, HostListener, Input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-detail-modal',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './user-detail-modal.component.html',
  styleUrls: ['./user-detail-modal.component.css'],
})
export class UserDetailModalComponent {
  @Input() user: User | null = null;
  closed = output<void>();

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.user) {
      this.close();
    }
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
