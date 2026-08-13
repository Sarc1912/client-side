import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, FinancingPlan } from '../../../core/models';

interface SelectedItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-loan-request',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './loan-request.component.html',
  styleUrls: ['./loan-request.component.css']
})
export class LoanRequestComponent implements OnInit {
  currentStep = signal(1);
  submitted = signal(false);
  submitting = signal(false);
  loadingPlans = signal(false);
  error = signal('');

  plans = signal<FinancingPlan[]>([]);
  selectedPlanId = signal<number | null>(null);
  product = signal<Product | null>(null);
  selectedItems = signal<SelectedItem[]>([]);

  selectedPlan = () => this.plans().find(p => p.id === this.selectedPlanId()) ?? null;

  currencyCode = computed(() =>
    this.product()?.currency ?? this.selectedItems()[0]?.product.currency ?? 'USD'
  );

  steps = [
    { num: 1, label: 'Datos personales' },
    { num: 2, label: 'Plan' },
    { num: 3, label: 'Confirmación' },
  ];

  personalForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
  ) {
    this.personalForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nationalId: ['', Validators.required],
      address: [''],
    });

    const user = this.auth.currentUser();
    if (user) {
      this.personalForm.patchValue({
        fullName: user.fullName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        nationalId: user.nationalId ?? '',
        address: user.address ?? '',
      });
    }
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.queryParamMap.get('productId');

    if (productId) {
      this.api.get<Product>(`products/${productId}`).subscribe({
        next: (p) => {
          this.addSelected(p);
        },
        error: () => this.router.navigate(['/shop']),
      });
    }
  }

  loadPlans(p: Product): void {
    this.loadingPlans.set(true);
    if (Array.isArray(p.financingPlans) && p.financingPlans.length > 0) {
      this.plans.set(p.financingPlans.filter(pl => pl.isActive));
      this.loadingPlans.set(false);
      return;
    }
    this.api.get<FinancingPlan[]>('financing-plans').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.plans.set(list.filter(pl => pl.productId === p.id && pl.isActive));
        this.loadingPlans.set(false);
      },
      error: () => this.loadingPlans.set(false),
    });
  }

  totalPrice = computed(() =>
    this.selectedItems().reduce((acc, i) => acc + Number(i.product.basePrice) * i.quantity, 0)
  );

  private basePrice = computed(() => Number(this.product()?.basePrice ?? 1));

  private scaleFactor = computed(() => {
    const base = this.basePrice();
    return base > 0 ? this.totalPrice() / base : 1;
  });

  estimateDownPayment = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return Number((Number(plan.downPayment ?? 0) * this.scaleFactor()).toFixed(2));
  });

  interestAmount = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return Number(((this.totalPrice() * Number(plan.interestRateApr ?? 0)) / 100).toFixed(2));
  });

  totalToRepay = computed(() =>
    Number((this.totalPrice() + this.interestAmount()).toFixed(2))
  );

  estimateInstallment = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    const repay = this.totalToRepay();
    const down = this.estimateDownPayment();
    const n = Number(plan.numberOfInstallments) || 1;
    return Number(((repay - down) / n).toFixed(2));
  });

  itemsSummary = computed(() =>
    this.selectedItems()
      .map(i => `${i.product.title}${i.quantity > 1 ? ' ×' + i.quantity : ''}`)
      .join(', ')
  );

  addSelected(p: Product): void {
    const current = this.selectedItems();
    if (current.some(i => i.product.id === p.id)) return;
    this.product.set(p);
    this.selectedItems.set([...current, { product: p, quantity: 1 }]);
    this.loadPlans(p);
  }

  imageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  nextStep(): void {
    if (this.currentStep() === 1 && this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }
    if (this.currentStep() === 2) {
      if (!this.selectedPlanId()) {
        this.error.set('Debes seleccionar un plan de financiamiento');
        return;
      }
      if (this.selectedItems().length === 0) {
        this.error.set('Debes seleccionar al menos un producto');
        return;
      }
    }
    this.error.set('');
    this.currentStep.update(s => s + 1);
  }

  submit(): void {
    if (!this.selectedPlanId()) {
      this.error.set('Debes seleccionar un plan de financiamiento');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const user = this.auth.currentUser();
    const applicant = {
      fullName: this.personalForm.get('fullName')?.value,
      email: this.personalForm.get('email')?.value,
      phone: this.personalForm.get('phone')?.value,
      nationalId: this.personalForm.get('nationalId')?.value,
      address: this.personalForm.get('address')?.value,
    };

    const payload = {
      financingPlanId: this.selectedPlanId()!,
      items: this.selectedItems().map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
      ...(user?.id ? { userId: user.id } : { applicant }),
    };

    this.api.post('loan-applications', payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
      },
    });
  }
}
