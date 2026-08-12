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
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content card" style="max-width: 720px; max-height: 90vh; overflow-y: auto;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Nueva solicitud de préstamo</h3>
          <button class="close-btn" (click)="close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          @if (error()) {
            <div class="error-alert">{{ error() }}</div>
          }

          <!-- Client -->
          <div class="form-group">
            <label class="form-label">Cliente</label>
            <select [(ngModel)]="selectedUserId" class="form-input" required>
              <option [ngValue]="null" disabled>Selecciona un cliente</option>
              @for (u of clientUsers(); track u.id) {
                <option [ngValue]="u.id">{{ u.fullName }} — {{ u.email }}</option>
              }
            </select>
            @if (clientUsers().length === 0 && !loadingUsers()) {
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.35rem;">No hay clientes registrados</div>
            }
          </div>

          <!-- Selected products -->
          @if (selectedItems().length > 0) {
            <div class="sub-section">
              <h4 class="sub-title">Productos del préstamo</h4>
              <div class="item-list">
                @for (item of selectedItems(); track item.product.id) {
                  <div class="item-row">
                    <div class="item-info">
                      <span class="item-name">{{ item.product.title }}</span>
                      <span class="item-price">{{ item.product.basePrice | currency:'USD':'symbol':'1.0-0' }} c/u</span>
                    </div>
                    <div class="item-qty">
                      <button type="button" class="qty-btn" (click)="changeQty(item.product.id, -1)">−</button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button type="button" class="qty-btn" (click)="changeQty(item.product.id, 1)" [disabled]="item.quantity >= (item.product.stockQuantity || 1)">+</button>
                    </div>
                    <span class="item-subtotal">{{ item.product.basePrice * item.quantity | currency:'USD':'symbol':'1.0-0' }}</span>
                    <button type="button" class="item-remove" (click)="removeItem(item.product.id)" title="Quitar">✕</button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Add products -->
          <div class="sub-section">
            <h4 class="sub-title">Agregar productos al préstamo</h4>
            <div class="add-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="color:var(--text-muted);flex-shrink:0;">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" />
              </svg>
              <input [(ngModel)]="search" class="form-input" style="border:none;background:transparent;padding-left:0;" placeholder="Buscar productos..."/>
            </div>
            <div class="add-grid">
              @for (p of availableProducts(); track p.id) {
                <div class="add-card">
                  <div class="add-info">
                    <span class="add-name">{{ p.title }}</span>
                    <span class="add-price">{{ p.basePrice | currency:'USD':'symbol':'1.0-0' }} · Stock: {{ p.stockQuantity }}</span>
                  </div>
                  <button type="button" class="btn-ghost add-btn" [disabled]="p.stockQuantity === 0" (click)="addProduct(p)">
                    {{ p.stockQuantity === 0 ? 'Agotado' : '+ Añadir' }}
                  </button>
                </div>
              }
              @if (availableProducts().length === 0 && !loadingProducts()) {
                <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:0.5rem;">No hay más productos disponibles</div>
              }
            </div>
          </div>

          <!-- Plan -->
          @if (selectedItems().length > 0) {
            <div class="sub-section">
              <h4 class="sub-title">Plan de financiamiento</h4>
              <div class="plans-list">
                @for (plan of plans(); track plan.id) {
                  <div class="plan-option" [class.selected]="selectedPlanId() === plan.id" (click)="selectedPlanId.set(plan.id)">
                    <div class="plan-radio"><div class="radio-dot" [class.visible]="selectedPlanId() === plan.id"></div></div>
                    <div class="plan-detail">
                      <span class="plan-name">{{ plan.title ?? ('Plan #' + plan.id) }}</span>
                      <span class="plan-info">{{ plan.numberOfInstallments }} cuotas · {{ plan.interestRateApr }}% anual · {{ plan.downPayment | currency:'USD':'symbol':'1.0-0' }} enganche</span>
                    </div>
                    <div class="plan-monthly">
                      <span class="pm-val">{{ plan.installmentAmount | currency:'USD':'symbol':'1.0-0' }}</span>
                      <span class="pm-label">/cuota</span>
                    </div>
                  </div>
                }
                @if (plans().length === 0) {
                  <div style="text-align:center;color:var(--text-muted);padding:0.5rem;">No hay planes disponibles para el producto principal</div>
                }
              </div>
            </div>
          }

          <!-- Estimate preview -->
          @if (selectedItems().length > 0 && selectedPlan()) {
            <div class="estimate">
              <div class="est-header">
                <span class="est-title">Vista previa del cálculo</span>
                <span class="est-sub">{{ selectedPlan()?.title ?? ('Plan #' + selectedPlan()?.id) }}</span>
              </div>
              <div class="est-row"><span>Monto (productos)</span><strong>{{ totalPrice() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <div class="est-row"><span>Porcentaje de interés</span><strong>{{ selectedPlan()?.interestRateApr }}%</strong></div>
              <div class="est-row"><span>Plazo</span><strong>{{ selectedPlan()?.numberOfInstallments }} meses</strong></div>
              <div class="est-row"><span>Interés calculado</span><strong>{{ interestAmount() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <div class="est-row"><span>Enganche estimado</span><strong>{{ estimateDownPayment() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <div class="est-row est-total"><span>Cuota mensual</span><strong>{{ estimateInstallment() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              <div class="est-row est-total"><span>Total a pagar</span><strong>{{ totalToRepay() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
            </div>
          }

          <div class="modal-footer-actions">
            <button type="button" class="btn-secondary" (click)="close()">Cancelar</button>
            <button type="button" class="btn-primary" [disabled]="isSubmitting()" (click)="submit()">
              {{ isSubmitting() ? 'Creando...' : 'Crear solicitud' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-alert {
      margin-bottom: 1rem;
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
    .sub-section { margin-top: 1.25rem; }
    .sub-title { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.6rem; color: var(--text-secondary); }

    .item-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .item-row {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem 0.85rem;
    }
    .item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .item-name { font-size: 0.85rem; font-weight: 600; }
    .item-price { font-size: 0.72rem; color: var(--text-muted); }
    .item-qty { display: flex; align-items: center; gap: 0.4rem; }
    .qty-btn {
      width: 26px; height: 26px; border-radius: 6px;
      border: 1px solid var(--border); background: var(--bg-base);
      color: var(--text-primary); cursor: pointer; font-size: 0.9rem; line-height: 1;
    }
    .qty-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent-hover); }
    .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .qty-val { min-width: 22px; text-align: center; font-weight: 700; font-size: 0.9rem; }
    .item-subtotal { font-size: 0.9rem; font-weight: 700; color: var(--accent-hover); }
    .item-remove {
      width: 26px; height: 26px; border-radius: 6px;
      border: none; background: transparent; color: var(--text-muted);
      cursor: pointer; font-size: 0.8rem;
    }
    .item-remove:hover { color: var(--danger); }

    .add-search {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem 0.9rem; margin-bottom: 0.7rem;
    }
    .add-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .add-card {
      display: flex; align-items: center; gap: 0.65rem;
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem;
    }
    .add-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .add-name { font-size: 0.78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .add-price { font-size: 0.7rem; color: var(--text-muted); }
    .add-btn { font-size: 0.72rem; padding: 0.3rem 0.55rem; flex-shrink: 0; }
    .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .plans-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .plan-option {
      display: flex; align-items: center; gap: 1rem;
      background: var(--bg-surface); border: 2px solid var(--border);
      border-radius: 10px; padding: 0.85rem 1rem; cursor: pointer; transition: all 0.2s;
    }
    .plan-option:hover { border-color: var(--accent); }
    .plan-option.selected { border-color: var(--accent); background: var(--accent-light); }
    .plan-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .plan-option.selected .plan-radio { border-color: var(--accent); }
    .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); opacity: 0; transition: opacity 0.2s; }
    .radio-dot.visible { opacity: 1; }
    .plan-detail { flex: 1; }
    .plan-name { display: block; font-weight: 600; font-size: 0.9rem; }
    .plan-info { display: block; font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem; }
    .plan-monthly { display: flex; align-items: baseline; gap: 0.2rem; }
    .pm-val { font-size: 1.1rem; font-weight: 700; color: var(--accent-hover); }
    .pm-label { font-size: 0.75rem; color: var(--text-muted); }

    .estimate {
      margin-top: 1.25rem;
      background: var(--accent-light); border: 1px solid var(--accent);
      border-radius: 12px; padding: 1rem 1.15rem;
      display: flex; flex-direction: column; gap: 0.45rem;
    }
    .est-header { margin-bottom: 0.25rem; display: flex; flex-direction: column; }
    .est-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
    .est-sub { font-size: 0.75rem; color: var(--text-muted); }
    .est-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); }
    .est-row strong { color: var(--text-primary); }
    .est-total { border-top: 1px solid var(--accent); padding-top: 0.6rem; margin-top: 0.3rem; font-size: 1rem; }
    .est-total strong { color: var(--accent-hover); font-size: 1.1rem; }

    .modal-footer-actions {
      display: flex; justify-content: flex-end; gap: 0.6rem;
      margin-top: 1.5rem;
    }
  `],
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
