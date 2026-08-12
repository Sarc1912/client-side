import { Component, OnInit, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { FinancingPlan, Product, User } from '../../../core/models';

interface SelectedItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-loan-create-modal',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './loan-create-modal.component.html',
  styleUrls: ['./loan-create-modal.component.css'],
})
export class LoanCreateModalComponent implements OnInit {
  closed = output<void>();
  created = output<void>();

  loadingUsers = signal(true);
  loadingProducts = signal(true);
  isSubmitting = signal(false);
  error = signal('');

  users = signal<User[]>([]);
  products = signal<Product[]>([]);
  plans = signal<FinancingPlan[]>([]);
  selectedItems = signal<SelectedItem[]>([]);
  selectedPlanId = signal<number | null>(null);
  selectedUserId = signal<number | null>(null);
  search = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<User[]>('users').subscribe({
      next: (data) => {
        this.users.set(Array.isArray(data) ? data : []);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });

    this.api.get<Product[]>('products').subscribe({
      next: (data) => {
        this.products.set(
          (Array.isArray(data) ? data : []).filter(p => p.status === 'active')
        );
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  clientUsers = computed(() =>
    this.users().filter(u => u.role === 'client' || u.role === 'customer')
  );

  availableProducts = computed(() => {
    const q = this.search().toLowerCase();
    const selectedIds = new Set(this.selectedItems().map(i => i.product.id));
    return this.products()
      .filter(p => !selectedIds.has(p.id))
      .filter(p => !q || p.title.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q))
      .slice(0, 12);
  });

  mainProduct = computed(() => this.selectedItems()[0]?.product ?? null);

  selectedPlan = computed(() => this.plans().find(p => p.id === this.selectedPlanId()) ?? null);

  totalPrice = computed(() =>
    this.selectedItems().reduce((acc, i) => acc + Number(i.product.basePrice) * i.quantity, 0)
  );

  interestAmount = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return Number(((this.totalPrice() * Number(plan.interestRateApr ?? 0)) / 100).toFixed(2));
  });

  totalToRepay = computed(() =>
    Number((this.totalPrice() + this.interestAmount()).toFixed(2))
  );

  private basePrice = computed(() => {
    const plan = this.selectedPlan();
    if (plan?.product?.basePrice) return Number(plan.product.basePrice);
    return Number(this.mainProduct()?.basePrice ?? 1);
  });

  private scaleFactor = computed(() => {
    const base = this.basePrice();
    const total = this.totalPrice();
    return base > 0 ? total / base : 1;
  });

  estimateDownPayment = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return Number((Number(plan.downPayment ?? 0) * this.scaleFactor()).toFixed(2));
  });

  estimateInstallment = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    const repay = this.totalToRepay();
    const down = this.estimateDownPayment();
    const n = Number(plan.numberOfInstallments) || 1;
    return Number(((repay - down) / n).toFixed(2));
  });

  addProduct(p: Product): void {
    const current = this.selectedItems();
    if (current.some(i => i.product.id === p.id)) return;
    const first = current.length === 0;
    this.selectedItems.set([...current, { product: p, quantity: 1 }]);
    this.selectedPlanId.set(null);
    if (first) {
      this.loadPlans(p.id);
    }
  }

  removeItem(productId: number): void {
    const remaining = this.selectedItems().filter(i => i.product.id !== productId);
    this.selectedItems.set(remaining);
    this.selectedPlanId.set(null);
    const main = remaining[0]?.product;
    if (main) {
      this.loadPlans(main.id);
    } else {
      this.plans.set([]);
    }
  }

  changeQty(productId: number, delta: number): void {
    this.selectedItems.update(list =>
      list.map(i => {
        if (i.product.id !== productId) return i;
        const max = i.product.stockQuantity || 1;
        const next = Math.max(1, Math.min(max, i.quantity + delta));
        return { ...i, quantity: next };
      })
    );
  }

  loadPlans(productId: number): void {
    this.api.get<FinancingPlan[]>('financing-plans').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.plans.set(list.filter(p => p.productId === productId && p.isActive));
      },
      error: () => this.plans.set([]),
    });
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (!this.selectedUserId()) {
      this.error.set('Debes seleccionar un cliente');
      return;
    }
    if (this.selectedItems().length === 0) {
      this.error.set('Debes agregar al menos un producto');
      return;
    }
    if (!this.selectedPlanId()) {
      this.error.set('Debes seleccionar un plan de financiamiento');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    const payload = {
      userId: this.selectedUserId()!,
      financingPlanId: this.selectedPlanId()!,
      items: this.selectedItems().map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.api.post('loan-applications', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.created.emit();
        this.closed.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo crear la solicitud');
      },
    });
  }
}
