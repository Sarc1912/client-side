import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { FinancingPlan, Product } from '../../../core/models';

@Component({
  selector: 'app-financing-plans',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './financing-plans.component.html',
  styleUrls: ['./financing-plans.component.css']
})
export class FinancingPlansComponent implements OnInit {
  plans = signal<FinancingPlan[]>([]);
  products = signal<Product[]>([]);
  loading = signal(true);
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  error = signal('');
  editingPlan = signal<FinancingPlan | null>(null);

  formData = {
    productId: null as number | null,
    title: '',
    numberOfInstallments: 12,
    installmentAmount: 0,
    downPayment: 0,
    frequency: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly',
    interestRateApr: 0,
    isActive: true,
  };

  preview = signal({
    baseAmount: 0,
    interestRate: 0,
    months: 0,
    interestAmount: 0,
    installment: 0,
    downPayment: 0,
    totalToRepay: 0,
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadProducts();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.api.get<FinancingPlan[]>('financing-plans').subscribe({
      next: (data) => { this.plans.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadProducts(): void {
    this.api.get<Product[]>('products').subscribe({
      next: (data) => {
        this.products.set(Array.isArray(data) ? data : []);
        this.recalc();
      },
      error: () => this.products.set([]),
    });
  }

  onProductChange(): void {
    this.recalc();
  }

  recalc(): void {
    const product = this.products().find(p => p.id === this.formData.productId);
    const baseAmount = Number(product?.basePrice ?? 0);
    const rate = Number(this.formData.interestRateApr ?? 0);
    const months = Number(this.formData.numberOfInstallments) || 1;
    const down = Number(this.formData.downPayment ?? 0);
    const interestAmount = Number(((baseAmount * rate) / 100).toFixed(2));
    const totalToRepay = Number((baseAmount + interestAmount).toFixed(2));
    const installment = Math.max(0, Number(((totalToRepay - down) / months).toFixed(2)));
    this.preview.set({ baseAmount, interestRate: rate, months, interestAmount, installment, downPayment: down, totalToRepay });
  }

  toggleActive(plan: FinancingPlan): void {
    this.api.patch(`financing-plans/${plan.id}`, { isActive: !plan.isActive }).subscribe({
      next: () => {
        this.plans.update(list => list.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      },
      error: (err) => alert(err?.error?.message ?? 'No se pudo actualizar el plan'),
    });
  }

  openCreate(): void {
    this.editingPlan.set(null);
    this.formData = {
      productId: null,
      title: '',
      numberOfInstallments: 12,
      installmentAmount: 0,
      downPayment: 0,
      frequency: 'monthly',
      interestRateApr: 0,
      isActive: true,
    };
    this.recalc();
    this.error.set('');
    this.isModalOpen.set(true);
  }

  openEdit(plan: FinancingPlan): void {
    this.editingPlan.set(plan);
    this.formData = {
      productId: plan.productId,
      title: plan.title ?? '',
      numberOfInstallments: plan.numberOfInstallments,
      installmentAmount: plan.installmentAmount,
      downPayment: plan.downPayment,
      frequency: plan.frequency,
      interestRateApr: plan.interestRateApr,
      isActive: plan.isActive,
    };
    this.recalc();
    this.error.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  savePlan(): void {
    if (!this.formData.productId) return;

    this.isSubmitting.set(true);
    this.error.set('');

    this.formData.installmentAmount = Number(this.preview().installment.toFixed(2));
    const payload = { ...this.formData };

    const req = this.editingPlan()
      ? this.api.patch<FinancingPlan>(`financing-plans/${this.editingPlan()!.id}`, payload)
      : this.api.post<FinancingPlan>('financing-plans', payload);

    req.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.loadPlans();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el plan');
      },
    });
  }
}
