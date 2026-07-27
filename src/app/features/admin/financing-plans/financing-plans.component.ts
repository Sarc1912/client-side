import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { FinancingPlan } from '../../../core/models';

@Component({
  selector: 'app-financing-plans',
  imports: [CurrencyPipe],
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
              <h3 class="plan-name">{{ plan.name }}</h3>
              <span class="badge" [class]="plan.isActive ? 'badge-success' : 'badge-muted'">
                {{ plan.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="plan-stats">
              <div class="plan-stat">
                <span class="ps-value">{{ plan.durationMonths }}</span>
                <span class="ps-label">meses</span>
              </div>
              <div class="plan-divider"></div>
              <div class="plan-stat">
                <span class="ps-value">{{ plan.interestRate }}%</span>
                <span class="ps-label">interés anual</span>
              </div>
              <div class="plan-divider"></div>
              <div class="plan-stat">
                <span class="ps-value">{{ plan.downPaymentPercent }}%</span>
                <span class="ps-label">enganche</span>
              </div>
            </div>
            <div class="plan-actions">
              <button class="btn-ghost" style="font-size:0.8rem;padding:0.4rem 0.75rem;" (click)="toggleActive(plan)">
                {{ plan.isActive ? 'Desactivar' : 'Activar' }}
              </button>
              <button class="btn-ghost" style="font-size:0.8rem;padding:0.4rem 0.75rem;">Editar</button>
            </div>
          </div>
        }
      }
    </div>
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
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `]
})
export class FinancingPlansComponent implements OnInit {
  plans = signal<FinancingPlan[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<FinancingPlan[]>('financing-plans').subscribe({
      next: (data) => { this.plans.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleActive(plan: FinancingPlan): void {
    this.api.patch(`financing-plans/${plan.id}`, { isActive: !plan.isActive }).subscribe(() => {
      this.plans.update(list => list.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
    });
  }

  openCreate(): void { /* TODO: open modal */ }
}
