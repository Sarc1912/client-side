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
  template: `
    <div class="lr-wrapper">
      <div class="lr-container">
        <!-- Progress steps -->
        <div class="steps">
          @for (step of steps; track step.num) {
            <div class="step" [class.active]="currentStep() === step.num" [class.done]="currentStep() > step.num">
              <div class="step-circle">{{ currentStep() > step.num ? '✓' : step.num }}</div>
              <span class="step-label">{{ step.label }}</span>
            </div>
            @if (!$last) { <div class="step-line" [class.done]="currentStep() > step.num"></div> }
          }
        </div>

        <!-- Step 1: Personal Info -->
        @if (currentStep() === 1) {
          <div class="step-panel">
            <h2 class="step-title">Datos personales</h2>
            <p class="step-sub">Completa tu información para continuar</p>
            <form [formGroup]="personalForm" class="form-grid">
              <div class="form-group">
                <label class="form-label" for="fullName">Nombre completo</label>
                <input id="fullName" formControlName="fullName" class="form-input" placeholder="Juan Pérez"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="email">Correo electrónico</label>
                <input id="email" formControlName="email" type="email" class="form-input" placeholder="juan@email.com"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="phone">Teléfono</label>
                <input id="phone" formControlName="phone" class="form-input" placeholder="+1 234 567 8900"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="nationalId">Documento de identidad</label>
                <input id="nationalId" formControlName="nationalId" class="form-input" placeholder="DUI / Pasaporte"/>
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label" for="address">Dirección</label>
                <input id="address" formControlName="address" class="form-input" placeholder="Calle, Ciudad, País"/>
              </div>
            </form>
          </div>
        }

        <!-- Step 2: Plan + Products -->
        @if (currentStep() === 2) {
          <div class="step-panel">
            <h2 class="step-title">Selecciona tu plan</h2>
            <p class="step-sub">Elige el plazo para financiar tu producto</p>

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
              @if (plans().length === 0 && !loadingPlans()) {
                <div style="text-align:center;color:var(--text-muted);padding:1rem;">No hay planes disponibles para este producto</div>
              }
            </div>

            <!-- Selected product -->
            @if (selectedItems().length > 0) {
              <div class="sub-section">
                <h4 class="sub-title">Producto del préstamo</h4>
                <div class="item-list">
                  @for (item of selectedItems(); track item.product.id) {
                    <div class="item-row">
                      <div class="item-thumb">
                        @if (item.product.images?.[0]) {
                          <img [src]="imageUrl(item.product.images[0].url)" alt=""/>
                        } @else {
                          <span>🛍️</span>
                        }
                      </div>
                      <div class="item-info">
                        <span class="item-name">{{ item.product.title }}</span>
                        <span class="item-price">{{ item.product.basePrice | currency:'USD':'symbol':'1.0-0' }} c/u</span>
                      </div>
                      <span class="item-subtotal">{{ item.product.basePrice * item.quantity | currency:'USD':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Estimate -->
            @if (selectedItems().length > 0 && selectedPlan()) {
              <div class="estimate">
                <div class="est-header">
                  <span class="est-title">Estimación del plan</span>
                  <span class="est-sub">{{ selectedPlan()?.title ?? ('Plan #' + selectedPlan()?.id) }}</span>
                </div>
                <div class="est-row"><span>Total productos</span><strong>{{ totalPrice() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="est-row"><span>Enganche estimado</span><strong>{{ estimateDownPayment() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="est-row"><span>Cuota estimada</span><strong>{{ estimateInstallment() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
                <div class="est-row est-total"><span>Total a financiar</span><strong>{{ estimateLoanAmount() | currency:'USD':'symbol':'1.2-2' }}</strong></div>
              </div>
            }
          </div>
        }

        <!-- Step 3: Confirm -->
        @if (currentStep() === 3) {
          <div class="step-panel">
            <h2 class="step-title">Confirma tu solicitud</h2>
            <p class="step-sub">Revisa los detalles antes de enviar</p>

            @if (submitted()) {
              <div class="success-panel">
                <div class="success-icon">✓</div>
                <h3>¡Solicitud enviada!</h3>
                <p>Tu solicitud está siendo revisada. Te contactaremos por correo en las próximas 24 horas.</p>
              </div>
            } @else {
              <div class="confirm-list">
                <div class="confirm-item">
                  <span class="ci-label">Nombre</span>
                  <span class="ci-val">{{ personalForm.get('fullName')?.value }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Email</span>
                  <span class="ci-val">{{ personalForm.get('email')?.value }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Productos</span>
                  <span class="ci-val">{{ itemsSummary() }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Precio total</span>
                  <span class="ci-val">{{ totalPrice() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Plan elegido</span>
                  <span class="ci-val">{{ selectedPlan()?.title ?? ('Plan #' + selectedPlan()?.id) }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Plazo</span>
                  <span class="ci-val">{{ selectedPlan()?.numberOfInstallments }} cuotas</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Enganche</span>
                  <span class="ci-val">{{ estimateDownPayment() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Cuota</span>
                  <span class="ci-val">{{ estimateInstallment() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Total a financiar</span>
                  <span class="ci-val">{{ estimateLoanAmount() | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            }

            @if (error()) {
              <div class="error-alert">{{ error() }}</div>
            }
          </div>
        }

        <!-- Navigation buttons -->
        @if (!submitted()) {
          <div class="step-nav">
            @if (currentStep() > 1) {
              <button class="btn-ghost" (click)="currentStep.update(s => s - 1)">← Anterior</button>
            } @else {
              <div></div>
            }
            @if (currentStep() < 3) {
              <button class="btn-primary" (click)="nextStep()">Continuar →</button>
            } @else {
              <button class="btn-primary" (click)="submit()" [disabled]="submitting()">
                {{ submitting() ? 'Enviando...' : 'Enviar solicitud' }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .lr-wrapper { min-height: 100vh; background: var(--bg-base); display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1rem; }
    .lr-container { width: 100%; max-width: 720px; }

    /* Steps */
    .steps { display: flex; align-items: center; margin-bottom: 2rem; }
    .step { display: flex; align-items: center; gap: 0.5rem; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--bg-card); border: 2px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
      transition: all 0.25s;
    }
    .step.active .step-circle { border-color: var(--accent); color: var(--accent-hover); background: var(--accent-light); }
    .step.done .step-circle { background: var(--accent); border-color: var(--accent); color: white; }
    .step-label { font-size: 0.8rem; color: var(--text-muted); }
    .step.active .step-label { color: var(--text-primary); font-weight: 600; }
    .step-line { flex: 1; height: 2px; background: var(--border); margin: 0 0.5rem; transition: background 0.25s; }
    .step-line.done { background: var(--accent); }

    .step-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 1.25rem; }
    .step-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.35rem; }
    .step-sub { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 540px) { .form-grid { grid-template-columns: 1fr; } }

    /* Plans */
    .plans-list { display: flex; flex-direction: column; gap: 0.65rem; }
    .plan-option {
      display: flex; align-items: center; gap: 1rem;
      background: var(--bg-surface); border: 2px solid var(--border);
      border-radius: 10px; padding: 1rem; cursor: pointer; transition: all 0.2s;
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
    .pm-val { font-size: 1.15rem; font-weight: 700; color: var(--accent-hover); }
    .pm-label { font-size: 0.75rem; color: var(--text-muted); }

    /* Sub sections */
    .sub-section { margin-top: 1.5rem; }
    .sub-title { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.75rem; color: var(--text-secondary); }

    .item-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .item-row {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem 0.85rem;
    }
    .item-thumb {
      width: 40px; height: 40px; border-radius: 8px; overflow: hidden;
      background: var(--bg-base); display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 1.1rem;
    }
    .item-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .item-info { flex: 1; display: flex; flex-direction: column; }
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

    /* Add products */
    .add-search {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem 0.9rem; margin-bottom: 0.85rem;
    }
    .add-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.6rem; }
    .add-card {
      display: flex; align-items: center; gap: 0.65rem;
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 0.6rem;
    }
    .add-thumb {
      width: 38px; height: 38px; border-radius: 8px; overflow: hidden;
      background: var(--bg-base); display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 1rem;
    }
    .add-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .add-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .add-name { font-size: 0.78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .add-price { font-size: 0.72rem; color: var(--text-muted); }
    .add-btn { font-size: 0.72rem; padding: 0.3rem 0.55rem; flex-shrink: 0; }
    .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Estimate */
    .estimate {
      margin-top: 1.5rem;
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

    /* Confirm */
    .confirm-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .confirm-item { display: flex; justify-content: space-between; padding: 0.65rem 0; border-bottom: 1px solid var(--border); }
    .confirm-item:last-child { border-bottom: none; }
    .ci-label { font-size: 0.8rem; color: var(--text-muted); }
    .ci-val { font-size: 0.875rem; font-weight: 500; text-align: right; }

    /* Success */
    .success-panel { text-align: center; padding: 1rem; }
    .success-icon {
      width: 64px; height: 64px;
      background: rgba(34,197,94,0.15); border: 2px solid #22c55e;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; color: #22c55e;
      margin: 0 auto 1rem;
    }
    .success-panel h3 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem; }
    .success-panel p { color: var(--text-muted); font-size: 0.9rem; }

    /* Error */
    .error-alert {
      margin-top: 1rem;
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
    }

    /* Nav */
    .step-nav { display: flex; justify-content: space-between; }
  `]
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

  estimateInstallment = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return 0;
    return Number((Number(plan.installmentAmount ?? 0) * this.scaleFactor()).toFixed(2));
  });

  estimateLoanAmount = computed(() =>
    Number((this.totalPrice() - this.estimateDownPayment()).toFixed(2))
  );

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
