import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-shop',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit, OnDestroy {
  products = signal<Product[]>([]);
  filtered = signal<Product[]>([]);
  categories = signal<string[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedCategory = signal('');

  // Control de índices actuales para cada producto en el carrusel
  currentImageIndexes: { [productId: number]: number } = {};
  private carouselInterval: any;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
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
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  startAutoCarousel(): void {
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

  getCurrentImage(product: Product): string {
    if (!product.images || product.images.length === 0) return '';
    const index = this.currentImageIndexes[product.id] || 0;
    return product.images[index].url;
  }

  getCurrentAlt(product: Product): string {
    if (!product.images || product.images.length === 0) return product.title;
    const index = this.currentImageIndexes[product.id] || 0;
    return product.images[index].altText || product.title;
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