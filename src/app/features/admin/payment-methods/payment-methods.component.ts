import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PaymentMethod } from '../../../core/models';

@Component({
  selector: 'app-payment-methods',
  imports: [FormsModule],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.css']
})
export class PaymentMethodsComponent implements OnInit {
  methods = signal<PaymentMethod[]>([]);
  loading = signal(true);
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  error = signal('');
  editingMethod = signal<PaymentMethod | null>(null);

  formData = {
    name: '',
    code: '',
    icon: '',
    description: '',
    requiresReference: false,
    isActive: true,
    sortOrder: 0,
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadMethods();
  }

  loadMethods(): void {
    this.loading.set(true);
    this.api.get<PaymentMethod[]>('payment-methods').subscribe({
      next: (data) => { this.methods.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleActive(m: PaymentMethod): void {
    this.api.patch(`payment-methods/${m.id}`, { isActive: !m.isActive }).subscribe({
      next: () => {
        this.methods.update(list => list.map(x => x.id === m.id ? { ...x, isActive: !x.isActive } : x));
      },
      error: (err) => alert(err?.error?.message ?? 'No se pudo actualizar el método'),
    });
  }

  openCreate(): void {
    this.editingMethod.set(null);
    this.formData = {
      name: '',
      code: '',
      icon: '',
      description: '',
      requiresReference: false,
      isActive: true,
      sortOrder: 0,
    };
    this.error.set('');
    this.isModalOpen.set(true);
  }

  openEdit(m: PaymentMethod): void {
    this.editingMethod.set(m);
    this.formData = {
      name: m.name,
      code: m.code,
      icon: m.icon ?? '',
      description: m.description ?? '',
      requiresReference: m.requiresReference,
      isActive: m.isActive,
      sortOrder: m.sortOrder,
    };
    this.error.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveMethod(): void {
    if (!this.formData.name || !this.formData.code) return;

    this.isSubmitting.set(true);
    this.error.set('');

    const payload = { ...this.formData };

    const req = this.editingMethod()
      ? this.api.patch<PaymentMethod>(`payment-methods/${this.editingMethod()!.id}`, payload)
      : this.api.post<PaymentMethod>('payment-methods', payload);

    req.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.loadMethods();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el método');
      },
    });
  }

  deleteMethod(m: PaymentMethod): void {
    if (!confirm(`¿Eliminar el método "${m.name}"?`)) return;
    this.api.delete(`payment-methods/${m.id}`).subscribe({
      next: () => this.loadMethods(),
      error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar el método'),
    });
  }
}
