import { Component, HostListener, Input, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-edit-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './user-edit-modal.component.html',
  styleUrls: ['./user-edit-modal.component.css'],
})
export class UserEditModalComponent implements OnInit {
  @Input() user: User | null = null;
  closed = output<void>();
  saved = output<User>();

  isSubmitting = signal(false);
  error = signal('');
  form: FormGroup;

  statuses = ['active', 'suspended', 'blocked'];
  roles = [
    'client', 'customer', 'employee', 'cashier',
    'supervisor', 'manager', 'admin',
  ];

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nationalId: ['', Validators.required],
      address: [''],
      creditScore: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
      status: ['active', Validators.required],
      role: ['client', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.user) {
      this.form.patchValue({
        fullName: this.user.fullName ?? '',
        email: this.user.email ?? '',
        phone: this.user.phone ?? '',
        nationalId: this.user.nationalId ?? '',
        address: this.user.address ?? '',
        creditScore: this.user.creditScore ?? 600,
        status: this.user.status ?? 'active',
        role: this.user.role ?? 'client',
      });
    }
  }

  submit(): void {
    if (!this.user) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.error.set('');
    this.api.patch<User>(`users/${this.user.id}`, this.form.value).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        this.saved.emit(updated);
        this.closed.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo actualizar el usuario');
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.user) {
      this.close();
    }
  }
}
