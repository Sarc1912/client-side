import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { FinancingPlan, Product } from '../../../core/models';

@Component({
  selector: 'app-financing-plans',
  imports: [CurrencyPipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Planes de Financiamiento</h1>
        <p class="page-subtitle">Configura los planes disponibles para los productos</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/></svg>
        Nuevo plan
      </button>
    </div>

    <div class="plans-grid">
      @if (loading()) {
        @for (i of [1,2,3,4]; track i) {
          <div class="plan-skeleton"></div>
        }
      } @else if (plans().length === 0) {
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No hay planes configurados</div>
      } @else {
        @for (plan of plans(); track plan.id) {
          <div class="plan-card" [class.inactive]="!plan.isActive">
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.title ?? ('Plan #' + plan.id) }}</h3>
              <span class="badge" [class]="plan.isActive ? 'badge-success' : 'badge-muted'">
                {{ plan.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);">
              {{ plan.product?.title ?? ('Producto #' + plan.productId) }}
            </div>
            <div class="plan-stats">
              <div class="plan-stat">
                <span class="ps-value">{{ plan.numberOfInstallments }}</span>
                <span class="ps-label">cuotas</span>
              </div>
              <div class="plan-divider"></div>
              <div class="plan-stat">
                <span class="ps-value">{{ plan.interestRateApr }}%</span>
                <span class="ps-label">interés anual</span>
              </div>
              <div class="plan-divider"></div>
              <div class="plan-stat">
                <span class="ps-value">{{ plan.downPayment | currency:'USD':'symbol':'1.0-0' }}</span>
                <span class="ps-label">enganche</span>
              </div>
            </div>
            <div class="plan-actions">
              <button class="btn-ghost" style="font-size:0.8rem;padding:0.4rem 0.75rem;" (click)="toggleActive(plan)">
                {{ plan.isActive ? 'Desactivar' : 'Activar' }}
              </button>
              <button class="btn-ghost" style="font-size:0.8rem;padding:0.4rem 0.75rem;" (click)="openEdit(plan)">Editar</button>
            </div>
          </div>
        }
      }
    </div>

    @if (isModalOpen()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingPlan() ? 'Editar Plan' : 'Nuevo Plan' }}</h3>
            <button class="close-btn" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <form (ngSubmit)="savePlan()" #planForm="ngForm" class="modal-body">
            @if (error()) {
              <div class="error-alert" style="margin-bottom:1rem;">{{ error() }}</div>
            }

            <div class="form-group">
              <label class="form-label">Producto</label>
              <select name="productId" [(ngModel)]="formData.productId" (ngModelChange)="onProductChange()" class="form-input" required>
                <option [ngValue]="null" disabled>Selecciona un producto</option>
                @for (product of products(); track product.id) {
                  <option [ngValue]="product.id">{{ product.title }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Título (opcional)</label>
              <input type="text" name="title" [(ngModel)]="formData.title" class="form-input" placeholder="Ej. Plan 12 meses"/>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nº de cuotas</label>
                <input type="number" name="numberOfInstallments" [(ngModel)]="formData.numberOfInstallments" (ngModelChange)="recalc()" class="form-input" required min="1"/>
              </div>
              <div class="form-group">
                <label class="form-label">Frecuencia</label>
                <select name="frequency" [(ngModel)]="formData.frequency" class="form-input" required>
                  <option value="weekly">Semanal</option>
                  <option value="bi-weekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cuota mensual (auto)</label>
                <div class="cuota-display">{{ preview().installment | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">Enganche</label>
                <input type="number" name="downPayment" [(ngModel)]="formData.downPayment" (ngModelChange)="recalc()" class="form-input" min="0" step="0.01"/>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tasa de interés anual (%)</label>
              <input type="number" name="interestRateApr" [(ngModel)]="formData.interestRateApr" (ngModelChange)="recalc()" class="form-input" min="0" step="0.01"/>
            </div>

            <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:var(--text-secondary);">
              <input type="checkbox" name="isActive" [(ngModel)]="formData.isActive"/>
              Plan activo
            </label>

            @if (preview().baseAmount > 0) {
              <div class="plan-preview">
                <div class="pp-header">
                  <span class="pp-title">Vista previa del cálculo</span>
                  <span class="pp-sub">Cuota calculada automáticamente según monto, porcentaje y plazo</span>
                </div>
                <div class="pp-row"><span>Monto (producto)</span><strong>{{ preview().baseAmount | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="pp-row"><span>Porcentaje de interés</span><strong>{{ preview().interestRate }}%</strong></div>
                <div class="pp-row"><span>Plazo</span><strong>{{ preview().months }} meses</strong></div>
                <div class="pp-row"><span>Interés calculado</span><strong>{{ preview().interestAmount | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="pp-row"><span>Enganche</span><strong>{{ preview().downPayment | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="pp-row pp-total"><span>Cuota mensual</span><strong>{{ preview().installment | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="pp-row pp-total"><span>Total a pagar</span><strong>{{ preview().totalToRepay | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!planForm.valid || isSubmitting()">
                {{ isSubmitting() ? 'Guardando...' : (editingPlan() ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .plan-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .plan-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
    .plan-card.inactive { opacity: 0.6; }
    .plan-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .plan-name { margin: 0; font-size: 0.95rem; font-weight: 600; }
    .plan-stats { display: flex; align-items: center; gap: 0.75rem; }
    .plan-stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .ps-value { font-size: 1.35rem; font-weight: 700; color: var(--accent-hover); }
    .ps-label { font-size: 0.68rem; color: var(--text-muted); text-align: center; }
    .plan-divider { width: 1px; height: 36px; background: var(--border); }
    .plan-actions { display: flex; gap: 0.5rem; }
    .plan-skeleton {
      height: 160px; border-radius: 12px;
      background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border) 50%, var(--bg-hover) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .cuota-display {
      background: var(--bg-base); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem 0.9rem;
      font-size: 1rem; font-weight: 700; color: var(--accent-hover);
    }
    .plan-preview {
      margin: 1.25rem 0;
      background: var(--accent-light); border: 1px solid var(--accent);
      border-radius: 12px; padding: 1rem 1.15rem;
      display: flex; flex-direction: column; gap: 0.45rem;
    }
    .pp-header { margin-bottom: 0.25rem; display: flex; flex-direction: column; }
    .pp-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
    .pp-sub { font-size: 0.75rem; color: var(--text-muted); }
    .pp-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); }
    .pp-row strong { color: var(--text-primary); }
    .pp-total { border-top: 1px solid var(--accent); padding-top: 0.6rem; margin-top: 0.3rem; font-size: 1rem; }
    .pp-total strong { color: var(--accent-hover); font-size: 1.1rem; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .error-alert {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }
  `]
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
