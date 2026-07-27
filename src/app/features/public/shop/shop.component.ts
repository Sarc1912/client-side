import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-shop',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  template: `
    <div class="shop-wrapper">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-orb hero-orb1"></div>
        <div class="hero-orb hero-orb2"></div>
        <div class="hero-content">
          <span class="hero-tag">Financiamiento Flexible</span>
          <h1 class="hero-title">Equipa tu vida,<br><span class="hero-accent">paga a tu ritmo</span></h1>
          <p class="hero-sub">Encuentra el producto perfecto y solicita financiamiento en minutos con tasas competitivas.</p>
          <div class="hero-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="hs-icon"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/></svg>
            <input [(ngModel)]="searchQuery" (ngModelChange)="filterProducts()" class="hs-input" placeholder="Buscar productos..."/>
          </div>
        </div>
      </div>

      <div class="shop-main">
        <!-- Categories sidebar -->
        <aside class="cat-sidebar">
          <h3 class="cat-title">Categorías</h3>
          <button class="cat-item" [class.active]="selectedCategory() === ''" (click)="selectedCategory.set('');filterProducts()">
            Todos los productos
          </button>
          @for (cat of categories(); track cat) {
            <button class="cat-item" [class.active]="selectedCategory() === cat" (click)="selectedCategory.set(cat);filterProducts()">
              {{ cat }}
            </button>
          }
        </aside>

        <!-- Product grid -->
        <div class="product-grid">
          @if (loading()) {
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="product-skeleton"></div>
            }
          } @else if (filtered().length === 0) {
            <div class="empty-shop">
              <p>No se encontraron productos</p>
            </div>
          } @else {
            @for (product of filtered(); track product.id) {
              <div class="product-card">
                <div class="product-img-wrapper">
                  <div class="product-img-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style="color:var(--text-muted)">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="1.5"/>
                      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <div class="product-badge-stock" [class.out]="product.stockQuantity === 0">
                    {{ product.stockQuantity > 0 ? 'En stock' : 'Agotado' }}
                  </div>
                </div>
                <div class="product-body">
                  <span class="product-brand">{{ product.brand ?? product.category?.name ?? 'Sin marca' }}</span>
                  <h3 class="product-title">{{ product.title }}</h3>
                  <div class="product-price-row">
                    <span class="product-price">{{ product.basePrice | currency:'USD':'symbol':'1.0-0' }}</span>
                    @if (product.financingPlans && product.financingPlans.length > 0) {
                      <span class="product-installment">desde 12 cuotas</span>
                    }
                  </div>
                  @if (product.financingPlans && product.financingPlans.length > 0) {
                    <div class="plans-pills">
                      @for (plan of product.financingPlans.slice(0, 3); track plan.id) {
                        <span class="plan-pill">{{ plan.durationMonths }}m</span>
                      }
                    </div>
                  }
                  <button class="btn-primary shop-cta" [disabled]="product.stockQuantity === 0" [routerLink]="['/loan-request']" [queryParams]="{productId: product.id}">
                    {{ product.stockQuantity > 0 ? 'Solicitar financiamiento' : 'No disponible' }}
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop-wrapper { background: var(--bg-base); min-height: 100vh; }

    /* Hero */
    .hero {
      position: relative; overflow: hidden;
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #0f1117 0%, #1a1d27 100%);
      border-bottom: 1px solid var(--border);
    }
    .hero-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
    .hero-orb1 { width: 400px; height: 400px; background: #6366f1; top: -100px; right: -80px; }
    .hero-orb2 { width: 250px; height: 250px; background: #8b5cf6; bottom: -80px; left: 20%; }
    .hero-content { position: relative; z-index: 1; max-width: 600px; }
    .hero-tag {
      display: inline-block;
      background: var(--accent-light); border: 1px solid var(--accent);
      color: var(--accent-hover);
      padding: 0.25rem 0.875rem; border-radius: 999px;
      font-size: 0.78rem; font-weight: 600; margin-bottom: 1rem;
    }
    .hero-title { font-size: 2.5rem; font-weight: 800; line-height: 1.15; margin: 0 0 0.75rem; }
    .hero-accent { background: linear-gradient(90deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-sub { color: var(--text-secondary); margin: 0 0 1.5rem; font-size: 1rem; }
    .hero-search {
      position: relative; max-width: 420px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 12px; display: flex; align-items: center;
      padding: 0 1rem;
    }
    .hs-icon { color: var(--text-muted); flex-shrink: 0; }
    .hs-input { flex: 1; background: none; border: none; outline: none; padding: 0.875rem 0.75rem; color: var(--text-primary); font-size: 0.95rem; font-family: inherit; }
    .hs-input::placeholder { color: var(--text-muted); }

    /* Main layout */
    .shop-main { display: flex; gap: 1.5rem; padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; }

    /* Categories */
    .cat-sidebar { width: 180px; flex-shrink: 0; }
    .cat-title { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0 0 0.75rem; }
    .cat-item {
      display: block; width: 100%;
      padding: 0.5rem 0.75rem; background: none; border: none;
      text-align: left; color: var(--text-secondary); font-size: 0.85rem;
      border-radius: 6px; cursor: pointer; transition: all 0.15s;
      margin-bottom: 0.15rem;
    }
    .cat-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .cat-item.active { background: var(--accent-light); color: var(--accent-hover); font-weight: 600; }

    /* Grid */
    .product-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; align-content: start; }
    .empty-shop { grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted); }
    .product-skeleton {
      height: 300px; border-radius: 12px;
      background: linear-gradient(90deg, var(--bg-card) 25%, var(--border) 50%, var(--bg-card) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .product-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
      overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;
    }
    .product-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.35); border-color: var(--accent); }
    .product-img-wrapper { position: relative; }
    .product-img-placeholder {
      height: 150px; background: var(--bg-surface);
      display: flex; align-items: center; justify-content: center;
    }
    .product-badge-stock {
      position: absolute; top: 0.5rem; right: 0.5rem;
      padding: 0.2rem 0.55rem; border-radius: 999px;
      font-size: 0.7rem; font-weight: 600;
      background: rgba(34,197,94,0.15); color: #4ade80;
    }
    .product-badge-stock.out { background: rgba(239,68,68,0.15); color: #f87171; }
    .product-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .product-brand { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .product-title { font-size: 0.9rem; font-weight: 600; margin: 0; line-height: 1.3; }
    .product-price-row { display: flex; align-items: baseline; gap: 0.5rem; }
    .product-price { font-size: 1.15rem; font-weight: 700; color: var(--accent-hover); }
    .product-installment { font-size: 0.72rem; color: var(--text-muted); }
    .plans-pills { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .plan-pill {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 999px; padding: 0.15rem 0.45rem;
      font-size: 0.68rem; color: var(--text-muted);
    }
    .shop-cta { width: 100%; justify-content: center; margin-top: 0.5rem; font-size: 0.8rem; padding: 0.55rem; }
    .shop-cta:disabled { opacity: 0.5; cursor: not-allowed; }
    .shop-cta:disabled:hover { transform: none; }
  `]
})
export class ShopComponent implements OnInit {
  products = signal<Product[]>([]);
  filtered = signal<Product[]>([]);
  categories = signal<string[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedCategory = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<Product[]>('products').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.products.set(list);
        this.filtered.set(list.filter(p => p.status === 'active'));
        const cats = [...new Set(list.map(p => p.category?.name ?? '').filter(Boolean))];
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterProducts(): void {
    const q = this.searchQuery.toLowerCase();
    const cat = this.selectedCategory();
    this.filtered.set(
      this.products()
        .filter(p => p.status === 'active')
        .filter(p => !q || p.title.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q))
        .filter(p => !cat || p.category?.name === cat)
    );
  }
}
