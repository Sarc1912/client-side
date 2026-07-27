import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Product, FinancingPlan } from '../../../core/models';

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

        <!-- Step 2: Select Plan -->
        @if (currentStep() === 2) {
          <div class="step-panel">
            <h2 class="step-title">Selecciona tu plan</h2>
            <p class="step-sub">Elige el plazo que mejor se adapte a tu presupuesto</p>

            @if (product()) {
              <div class="product-summary-card">
                <div class="pscard-body">
                  <span class="pscard-label">Producto seleccionado</span>
                  <h4 class="pscard-name">{{ product()!.title }}</h4>
                  <span class="pscard-price">{{ product()!.basePrice | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
              </div>
            }

            <div class="plans-list">
              @for (plan of plans(); track plan.id) {
                <div class="plan-option" [class.selected]="selectedPlanId() === plan.id" (click)="selectedPlanId.set(plan.id)">
                  <div class="plan-radio"><div class="radio-dot" [class.visible]="selectedPlanId() === plan.id"></div></div>
                  <div class="plan-detail">
                    <span class="plan-name">{{ plan.name }}</span>
                    <span class="plan-info">{{ plan.durationMonths }} meses · {{ plan.interestRate }}% anual · {{ plan.downPaymentPercent }}% enganche</span>
                  </div>
                  @if (product()) {
                    <div class="plan-monthly">
                      <span class="pm-val">{{ calcMonthly(product()!.basePrice, plan) | currency:'USD':'symbol':'1.0-0' }}</span>
                      <span class="pm-label">/mes</span>
                    </div>
                  }
                </div>
              }
            </div>
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
                  <span class="ci-label">Producto</span>
                  <span class="ci-val">{{ product()?.title }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Precio base</span>
                  <span class="ci-val">{{ product()?.basePrice | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Plan elegido</span>
                  <span class="ci-val">{{ selectedPlan()?.name }}</span>
                </div>
                <div class="confirm-item">
                  <span class="ci-label">Plazo</span>
                  <span class="ci-val">{{ selectedPlan()?.durationMonths }} meses</span>
                </div>
              </div>
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
    .lr-container { width: 100%; max-width: 680px; }

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

    /* Product summary card */
    .product-summary-card {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;
    }
    .pscard-body { display: flex; flex-direction: column; gap: 0.2rem; }
    .pscard-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .pscard-name { font-weight: 600; margin: 0; }
    .pscard-price { font-size: 1.1rem; font-weight: 700; color: var(--accent-hover); }

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

    /* Confirm */
    .confirm-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .confirm-item { display: flex; justify-content: space-between; padding: 0.65rem 0; border-bottom: 1px solid var(--border); }
    .confirm-item:last-child { border-bottom: none; }
    .ci-label { font-size: 0.8rem; color: var(--text-muted); }
    .ci-val { font-size: 0.875rem; font-weight: 500; }

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

    /* Nav */
    .step-nav { display: flex; justify-content: space-between; }
  `]
})
export class LoanRequestComponent implements OnInit {
  currentStep = signal(1);
  submitted = signal(false);
  submitting = signal(false);

  product = signal<Product | null>(null);
  plans = signal<FinancingPlan[]>([]);
  selectedPlanId = signal<number | null>(null);

  selectedPlan = () => this.plans().find(p => p.id === this.selectedPlanId()) ?? null;

  steps = [
    { num: 1, label: 'Datos personales' },
    { num: 2, label: 'Plan de financiamiento' },
    { num: 3, label: 'Confirmación' },
  ];

  personalForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
  ) {
    this.personalForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nationalId: ['', Validators.required],
      address: [''],
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId) {
      this.api.get<Product>(`products/${productId}`).subscribe(p => {
        this.product.set(p);
        if (p.financingPlans?.length) this.plans.set(p.financingPlans);
      });
    }
    this.api.get<FinancingPlan[]>('financing-plans').subscribe(plans => {
      if (!this.plans().length) this.plans.set(Array.isArray(plans) ? plans : []);
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1 && this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }
    this.currentStep.update(s => s + 1);
  }

  submit(): void {
    this.submitting.set(true);
    // Simulate submit — wire up to api.post('loan-applications', payload) when auth is ready
    setTimeout(() => { this.submitted.set(true); this.submitting.set(false); }, 1200);
  }

  calcMonthly(price: number, plan: FinancingPlan): number {
    const principal = price * (1 - plan.downPaymentPercent / 100);
    const monthlyRate = plan.interestRate / 100 / 12;
    const n = plan.durationMonths;
    if (monthlyRate === 0) return principal / n;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  }
}
