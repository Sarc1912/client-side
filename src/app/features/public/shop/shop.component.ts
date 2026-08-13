import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Product } from '../../../core/models';
import { ProductDetailModal } from '../../../components/product-detail-modal/product-detail-modal';

@Component({
  selector: 'app-shop',
  imports: [CurrencyPipe, FormsModule, RouterLink, ProductDetailModal],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit, OnDestroy {
  products = signal<Product[]>([]);
  filtered = signal<Product[]>([]);
  categories = signal<string[]>([]);
  loading = signal(true);
  error = signal(false);
  searchQuery = '';
  selectedCategory = signal('');

  isDetailOpen = signal(false);
  selectedProduct = signal<any>(null);

  // Control de índices actuales para cada producto en el carrusel
  currentImageIndexes: { [productId: number]: number } = {};
  private carouselInterval: any;

  constructor(private api: ApiService, public auth: AuthService, public theme: ThemeService) { }

  userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? 'U';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<Product[]>('products').subscribe({
      next: (data) => {
        const rawList = Array.isArray(data) ? data : [];

        const list = rawList.map(product => ({
          ...product,
          images: product.images ? product.images.map((img: any) => ({
            ...img,
            url: img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url.startsWith('/') ? '' : '/'}${img.url}`,
            isNew: false
          })) : []
        }));

        this.products.set(list);
        this.filtered.set(list.filter(p => p.status === 'active'));
        const cats = [...new Set(list.map(p => p.category?.name ?? '').filter(Boolean))];
        this.categories.set(cats);
        this.loading.set(false);

        // Inicializar índices en 0 para cada producto
        list.forEach(p => {
          this.currentImageIndexes[p.id] = 0;
        });

        // Iniciar movimiento automático cada 4 segundos
        this.startAutoCarousel();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  retry(): void {
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory.set('');
    this.filterProducts();
  }

  hasFilters(): boolean {
    return this.searchQuery.trim() !== '' || this.selectedCategory() !== '';
  }

  ngOnDestroy(): void {
    this.stopAutoCarousel();
  }

  startAutoCarousel(): void {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.stopAutoCarousel();
    this.carouselInterval = setInterval(() => {
      const currentFiltered = this.filtered();
      currentFiltered.forEach(product => {
        if (product.images && product.images.length > 1) {
          const currentIndex = this.currentImageIndexes[product.id] || 0;
          this.currentImageIndexes[product.id] = (currentIndex + 1) % product.images.length;
        }
      });
    }, 4000); // Cambia cada 4 segundos
  }

  stopAutoCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  heroExample = computed(() => {
    const withPlans = this.products().find(p => {
      const plans = p.financingPlans;
      return p.status === 'active' && Array.isArray(plans) && plans.length > 0;
    });
    if (!withPlans) return null;
    const plans = withPlans.financingPlans!
      .filter(pl => pl.isActive !== false)
      .sort((a, b) => a.installmentAmount - b.installmentAmount);
    const best = plans[0];
    if (!best) return null;
    return {
      title: withPlans.title,
      installment: best.installmentAmount,
      months: best.numberOfInstallments,
      currency: withPlans.currency,
    };
  });

  minInstallments(product: Product): number {
    const plans = (product.financingPlans ?? []).filter(pl => pl.isActive !== false);
    if (plans.length === 0) return 0;
    return Math.min(...plans.map(pl => pl.numberOfInstallments));
  }

  nextImage(productId: number, totalImages: number, event: Event): void {
    event.stopPropagation(); // Evita que se disparen otros eventos de la tarjeta
    const current = this.currentImageIndexes[productId] || 0;
    this.currentImageIndexes[productId] = (current + 1) % totalImages;
  }

  prevImage(productId: number, totalImages: number, event: Event): void {
    event.stopPropagation();
    const current = this.currentImageIndexes[productId] || 0;
    this.currentImageIndexes[productId] = (current - 1 + totalImages) % totalImages;
  }

  filterProducts(): void {
    this.error.set(false);
    const q = this.searchQuery.toLowerCase();
    const cat = this.selectedCategory();
    this.filtered.set(
      this.products()
        .filter(p => p.status === 'active')
        .filter(p => !q || p.title.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q))
        .filter(p => !cat || p.category?.name === cat)
    );
  }

  openDetail(product: any): void {
    this.stopAutoCarousel();
    this.selectedProduct.set(product);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedProduct.set(null);
    this.startAutoCarousel();
  }
}